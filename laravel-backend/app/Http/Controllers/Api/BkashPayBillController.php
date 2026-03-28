<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BkashPayBillService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * bKash Pay Bill Controller
 * 
 * Public endpoints that bKash calls for Pay Bill integration.
 * These are NOT behind auth middleware since bKash calls them directly.
 * 
 * Endpoints:
 * POST /api/bkash-paybill/inquiry   — Bill inquiry (validate customer, return bill info)
 * POST /api/bkash-paybill/payment   — Payment notification (process completed payment)
 */
class BkashPayBillController extends Controller
{
    public function __construct(protected BkashPayBillService $service) {}

    /**
     * Bill Inquiry — bKash calls this to validate customer and get bill info
     */
    public function inquiry(Request $request)
    {
        Log::info('bKash Pay Bill Inquiry Request', $request->all());

        $customerNo = $request->input('customerNo') 
            ?? $request->input('customer_id') 
            ?? $request->input('billAccountNo');

        if (!$customerNo) {
            return response()->json([
                'statusCode' => '0001',
                'statusMessage' => 'Customer number is required',
            ]);
        }

        $result = $this->service->billInquiry($customerNo);

        Log::info('bKash Pay Bill Inquiry Response', $result);

        return response()->json($result);
    }

    /**
     * Payment Notification — bKash calls this when payment is completed
     */
    public function payment(Request $request)
    {
        Log::info('bKash Pay Bill Payment Notification', $request->all());

        $result = $this->service->paymentNotification($request->all());

        Log::info('bKash Pay Bill Payment Response', $result);

        return response()->json($result);
    }
}
