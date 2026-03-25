<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IncomeHead;
use App\Models\ExpenseHead;
use App\Models\OtherHead;
use Illuminate\Http\Request;

class AccountingHeadController extends Controller
{
    // ── Income Heads ─────────────────────────────────────

    public function incomeHeads()
    {
        return response()->json(IncomeHead::orderBy('name')->get());
    }

    public function storeIncomeHead(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        return response()->json(IncomeHead::create($request->all()), 201);
    }

    public function updateIncomeHead(Request $request, string $id)
    {
        $head = IncomeHead::findOrFail($id);
        $head->update($request->all());
        return response()->json($head);
    }

    public function deleteIncomeHead(string $id)
    {
        IncomeHead::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ── Expense Heads ────────────────────────────────────

    public function expenseHeads()
    {
        return response()->json(ExpenseHead::orderBy('name')->get());
    }

    public function storeExpenseHead(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        return response()->json(ExpenseHead::create($request->all()), 201);
    }

    public function updateExpenseHead(Request $request, string $id)
    {
        $head = ExpenseHead::findOrFail($id);
        $head->update($request->all());
        return response()->json($head);
    }

    public function deleteExpenseHead(string $id)
    {
        ExpenseHead::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ── Other Heads ──────────────────────────────────────

    public function otherHeads()
    {
        return response()->json(OtherHead::orderBy('name')->get());
    }

    public function storeOtherHead(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        return response()->json(OtherHead::create($request->all()), 201);
    }

    public function updateOtherHead(Request $request, string $id)
    {
        $head = OtherHead::findOrFail($id);
        $head->update($request->all());
        return response()->json($head);
    }

    public function deleteOtherHead(string $id)
    {
        OtherHead::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
