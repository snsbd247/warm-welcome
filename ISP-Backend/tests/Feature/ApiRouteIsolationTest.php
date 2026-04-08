<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\GenericCrudController;
use App\Http\Controllers\Api\ResellerController;
use App\Http\Controllers\Api\SuperAdminController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiRouteIsolationTest extends TestCase
{
    public function test_super_admin_tenants_route_is_not_swallowed_by_generic_crud(): void
    {
        $route = Route::getRoutes()->match(Request::create('/api/super-admin/tenants', 'GET'));

        $this->assertSame(SuperAdminController::class.'@tenants', $route->getActionName());
        $this->assertContains('super.admin.auth', $route->gatherMiddleware());
    }

    public function test_reseller_dashboard_route_is_not_swallowed_by_generic_crud(): void
    {
        $route = Route::getRoutes()->match(Request::create('/api/reseller/dashboard', 'GET'));

        $this->assertSame(ResellerController::class.'@dashboard', $route->getActionName());
        $this->assertContains('reseller.auth', $route->gatherMiddleware());
    }

    public function test_generic_crud_still_matches_valid_table_routes(): void
    {
        $route = Route::getRoutes()->match(Request::create('/api/customers', 'GET'));

        $this->assertSame(GenericCrudController::class.'@index', $route->getActionName());
        $this->assertSame('customers', $route->parameter('table'));
        $this->assertContains('admin.auth', $route->gatherMiddleware());
    }
}