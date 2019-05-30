import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthRoutingModule } from './auth-routing.module';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';


import { AuthSandbox } from './auth.sandbox';
import { ValidationService } from 'src/app/core/validaton/validation.service';
import { SharedModule } from '../shared';
import { ResetComponent } from './reset/reset.component';


@NgModule({
  imports: [
    CommonModule,
    AuthRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule

    ],
  declarations: [RegisterComponent, LoginComponent, ResetComponent],
  providers: [ AuthSandbox, ValidationService]
})
export class AuthModule {}
