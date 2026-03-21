<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\MikrotikRouter;
use App\Models\Package;
use Illuminate\Support\Facades\Log;

class MikrotikService
{
    /**
     * Connect to MikroTik router via Classic API (TCP 8728).
     */
    protected function connect(MikrotikRouter $router): ?object
    {
        try {
            $socket = @fsockopen($router->ip_address, $router->api_port, $errno, $errstr, 5);
            if (!$socket) {
                Log::error("MikroTik connection failed: {$errstr}");
                return null;
            }

            // Login
            $this->writeWord($socket, '/login');
            $this->writeWord($socket, '=name=' . $router->username);
            $this->writeWord($socket, '=password=' . $router->password);
            $this->writeWord($socket, '');

            $response = $this->readResponse($socket);
            if (empty($response) || !str_contains(implode('', $response), '!done')) {
                fclose($socket);
                return null;
            }

            return (object)['socket' => $socket, 'router' => $router];
        } catch (\Exception $e) {
            Log::error('MikroTik connect error: ' . $e->getMessage());
            return null;
        }
    }

    protected function writeWord($socket, string $word): void
    {
        $len = strlen($word);
        if ($len < 0x80) {
            fwrite($socket, chr($len));
        } elseif ($len < 0x4000) {
            $len |= 0x8000;
            fwrite($socket, chr(($len >> 8) & 0xFF) . chr($len & 0xFF));
        } elseif ($len < 0x200000) {
            $len |= 0xC00000;
            fwrite($socket, chr(($len >> 16) & 0xFF) . chr(($len >> 8) & 0xFF) . chr($len & 0xFF));
        }
        fwrite($socket, $word);
    }

    protected function readResponse($socket): array
    {
        $response = [];
        stream_set_timeout($socket, 5);
        while (true) {
            $word = $this->readWord($socket);
            if ($word === false || $word === '') {
                if (!empty($response) && in_array(end($response), ['!done', '!trap'])) break;
                if (empty($word) && !empty($response)) break;
                continue;
            }
            $response[] = $word;
            if ($word === '!done' || $word === '!trap') break;
        }
        return $response;
    }

    protected function readWord($socket)
    {
        $byte = fread($socket, 1);
        if ($byte === false || $byte === '') return false;
        $len = ord($byte);

        if ($len >= 0x80) {
            if ($len < 0xC0) {
                $len = (($len & 0x3F) << 8) + ord(fread($socket, 1));
            } elseif ($len < 0xE0) {
                $len = (($len & 0x1F) << 16) + (ord(fread($socket, 1)) << 8) + ord(fread($socket, 1));
            }
        }

        if ($len === 0) return '';
        return fread($socket, $len);
    }

    protected function sendCommand($connection, array $command): array
    {
        foreach ($command as $word) {
            $this->writeWord($connection->socket, $word);
        }
        $this->writeWord($connection->socket, '');
        return $this->readResponse($connection->socket);
    }

    public function syncCustomer(string $customerId): array
    {
        $customer = Customer::with(['package', 'router'])->findOrFail($customerId);

        if (!$customer->router) {
            return ['success' => false, 'error' => 'No router assigned'];
        }

        if (!$customer->pppoe_username || !$customer->pppoe_password) {
            return ['success' => false, 'error' => 'Missing PPPoE credentials'];
        }

        $conn = $this->connect($customer->router);
        if (!$conn) {
            return ['success' => false, 'error' => 'Cannot connect to router'];
        }

        try {
            $profileName = $customer->package->mikrotik_profile_name ?? $customer->package->name ?? 'default';

            // Ensure profile exists
            $this->ensureProfile($conn, $customer->package, $profileName);

            // Check if secret exists
            $existing = $this->sendCommand($conn, [
                '/ppp/secret/print',
                '?name=' . $customer->pppoe_username,
            ]);

            $existingId = null;
            foreach ($existing as $line) {
                if (str_starts_with($line, '=.id=')) {
                    $existingId = substr($line, 4);
                }
            }

            if ($existingId) {
                // Update
                $this->sendCommand($conn, [
                    '/ppp/secret/set',
                    '=.id=' . $existingId,
                    '=password=' . $customer->pppoe_password,
                    '=profile=' . $profileName,
                    '=service=pppoe',
                    '=disabled=' . ($customer->status !== 'active' ? 'yes' : 'no'),
                ]);
            } else {
                // Create
                $cmd = [
                    '/ppp/secret/add',
                    '=name=' . $customer->pppoe_username,
                    '=password=' . $customer->pppoe_password,
                    '=profile=' . $profileName,
                    '=service=pppoe',
                ];
                if ($customer->ip_address) {
                    $cmd[] = '=remote-address=' . $customer->ip_address;
                }
                $this->sendCommand($conn, $cmd);
            }

            fclose($conn->socket);

            $customer->update(['mikrotik_sync_status' => 'synced']);
            return ['success' => true, 'message' => 'Customer synced to MikroTik'];
        } catch (\Exception $e) {
            @fclose($conn->socket);
            $customer->update(['mikrotik_sync_status' => 'error']);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    protected function ensureProfile($connection, ?Package $package, string $profileName): void
    {
        if (!$package) return;

        $check = $this->sendCommand($connection, [
            '/ppp/profile/print',
            '?name=' . $profileName,
        ]);

        $exists = false;
        foreach ($check as $line) {
            if (str_starts_with($line, '=.id=')) {
                $exists = true;
                break;
            }
        }

        if (!$exists) {
            $rateLimit = $package->upload_speed . 'M/' . $package->download_speed . 'M';
            $this->sendCommand($connection, [
                '/ppp/profile/add',
                '=name=' . $profileName,
                '=rate-limit=' . $rateLimit,
                '=local-address=10.10.10.1',
            ]);
        }
    }

    public function syncAllCustomers(): array
    {
        $customers = Customer::whereNotNull('router_id')
            ->whereNotNull('pppoe_username')
            ->where('status', '!=', 'disconnected')
            ->get();

        $results = ['synced' => 0, 'failed' => 0, 'total' => $customers->count()];

        foreach ($customers as $customer) {
            $result = $this->syncCustomer($customer->id);
            $result['success'] ? $results['synced']++ : $results['failed']++;
        }

        return $results;
    }

    public function testConnection(string $routerId): array
    {
        $router = MikrotikRouter::findOrFail($routerId);
        $conn = $this->connect($router);

        if (!$conn) {
            $router->update(['status' => 'offline']);
            return ['success' => false, 'error' => 'Connection failed'];
        }

        fclose($conn->socket);
        $router->update(['status' => 'active']);
        return ['success' => true, 'message' => 'Connection successful'];
    }
}
