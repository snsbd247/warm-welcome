<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StorageController extends Controller
{
    /**
     * Upload a file to a bucket (folder).
     * POST /api/storage/upload
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file'   => 'required|file|max:10240', // 10 MB
            'bucket' => 'required|string|max:64',
            'path'   => 'nullable|string|max:255',
        ]);

        $bucket = $request->input('bucket');
        $file   = $request->file('file');

        // Determine storage path
        $path = $request->input('path')
            ? $request->input('path')
            : $bucket . '/' . Str::uuid() . '.' . $file->getClientOriginalExtension();

        $fullPath = $bucket . '/' . ltrim($path, '/');

        // Upsert: delete existing then store
        if ($request->boolean('upsert') && Storage::disk('public')->exists($fullPath)) {
            Storage::disk('public')->delete($fullPath);
        }

        Storage::disk('public')->put($fullPath, file_get_contents($file));

        return response()->json([
            'path'       => $path,
            'full_path'  => $fullPath,
            'public_url' => url('/storage/' . $fullPath),
        ]);
    }

    /**
     * List files in a bucket/prefix.
     * GET /api/storage/list?bucket=avatars&prefix=user-id/
     */
    public function list(Request $request)
    {
        $request->validate([
            'bucket' => 'required|string',
            'prefix' => 'nullable|string',
        ]);

        $bucket = $request->input('bucket');
        $prefix = $request->input('prefix', '');
        $dir    = $bucket . ($prefix ? '/' . ltrim($prefix, '/') : '');

        $files = Storage::disk('public')->files($dir);

        $result = array_map(fn($f) => [
            'name' => basename($f),
            'path' => $f,
            'size' => Storage::disk('public')->size($f),
            'url'  => url('/storage/' . $f),
        ], $files);

        return response()->json(array_values($result));
    }

    /**
     * Download a file.
     * GET /api/storage/download?bucket=avatars&path=user-id/avatar.jpg
     */
    public function download(Request $request)
    {
        $request->validate([
            'bucket' => 'required|string',
            'path'   => 'required|string',
        ]);

        $fullPath = $request->input('bucket') . '/' . ltrim($request->input('path'), '/');

        if (!Storage::disk('public')->exists($fullPath)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return Storage::disk('public')->download($fullPath);
    }

    /**
     * Delete files.
     * POST /api/storage/delete  { bucket, paths: [...] }
     */
    public function delete(Request $request)
    {
        $request->validate([
            'bucket' => 'required|string',
            'paths'  => 'required|array',
            'paths.*' => 'string',
        ]);

        $bucket = $request->input('bucket');
        $deleted = [];

        foreach ($request->input('paths') as $path) {
            $fullPath = $bucket . '/' . ltrim($path, '/');
            if (Storage::disk('public')->exists($fullPath)) {
                Storage::disk('public')->delete($fullPath);
                $deleted[] = $path;
            }
        }

        return response()->json(['deleted' => $deleted]);
    }

    /**
     * Serve a public file (fallback if symlink not set up).
     * GET /api/storage/serve/{bucket}/{path}
     */
    public function serve(string $bucket, string $path)
    {
        $fullPath = $bucket . '/' . $path;

        if (!Storage::disk('public')->exists($fullPath)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        $mime = Storage::disk('public')->mimeType($fullPath);
        return response(Storage::disk('public')->get($fullPath))
            ->header('Content-Type', $mime)
            ->header('Cache-Control', 'public, max-age=31536000');
    }
}
