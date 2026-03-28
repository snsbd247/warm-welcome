<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with(['account']);

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('from') && $request->has('to')) {
            $query->whereBetween('date', [$request->from, $request->to]);
        }

        return response()->json(
            $query->orderBy('date', 'desc')->paginate($request->get('per_page', 50))
        );
    }

    public function show(string $id)
    {
        return response()->json(
            Expense::with(['account'])->findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'category'       => 'required|string|max:100',
            'amount'         => 'required|numeric|min:0.01',
            'date'           => 'required|date',
            'description'    => 'nullable|string|max:500',
            'payment_method' => 'nullable|string|max:50',
            'account_id'     => 'nullable|uuid|exists:accounts,id',
            'reference'      => 'nullable|string|max:255',
        ]);

        $expense = Expense::create([
            'category'       => $request->category,
            'amount'         => $request->amount,
            'date'           => $request->date,
            'description'    => $request->description,
            'payment_method' => $request->payment_method ?? 'cash',
            'account_id'     => $request->account_id,
            'reference'      => $request->reference,
            'status'         => 'active',
        ]);

        return response()->json($expense->load('account'), 201);
    }

    public function update(Request $request, string $id)
    {
        $expense = Expense::findOrFail($id);
        $expense->update($request->only([
            'category', 'amount', 'date', 'description',
            'payment_method', 'account_id', 'reference', 'status',
        ]));

        return response()->json($expense->fresh());
    }

    public function destroy(string $id)
    {
        Expense::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function summary(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to ?? now()->endOfMonth()->toDateString();

        $expenses = Expense::where('status', 'active')
            ->whereBetween('date', [$from, $to]);

        $byCategory = (clone $expenses)
            ->selectRaw('category, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('category')
            ->get();

        return response()->json([
            'from'          => $from,
            'to'            => $to,
            'total_expense' => (float) (clone $expenses)->sum('amount'),
            'total_count'   => (clone $expenses)->count(),
            'by_category'   => $byCategory,
        ]);
    }
}
