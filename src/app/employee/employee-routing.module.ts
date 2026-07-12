import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardEmployeeComponent } from './components/dashboard-employee/dashboard-employee.component';
import { CreateEmployeeComponent } from './components/create-employee/create-employee.component';
import { profileCompleteGuard } from '../core/guards/profile-complete.guard';
import { SideBarComponent } from '../rh/sidebar/sidebar.component';



const routes: Routes = [
  {
    path: '',
    component: SideBarComponent,
    children: [
      { path: '', redirectTo: 'dashboardmanager', pathMatch: 'full' },

      {
        path: 'dashboardmanager',
        component: DashboardEmployeeComponent,
        canActivate: [profileCompleteGuard],
      },
      {
        path: 'createEmployee',
        component: CreateEmployeeComponent,
        canActivate: [profileCompleteGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeRoutingModule {}
