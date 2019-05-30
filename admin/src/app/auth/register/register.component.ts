import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  FormControl
} from '@angular/forms';

import { AuthSandbox } from '../auth.sandbox';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnInit {
  public submitted = false;
  public name: AbstractControl;
  public email: AbstractControl;
  public password: AbstractControl;
  public confirmPassword: AbstractControl;
  public registerForm: FormGroup;
  public passwords: FormGroup;

  constructor(private fb: FormBuilder, public authSandbox: AuthSandbox) {}

  ngOnInit() {
   this.registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(4)]],
    email: ['', [Validators.required, this.authSandbox.validationService.validateEmail]],
    passwords: this.fb.group({
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(4)]]
    },
    {validator: this.authSandbox.validationService.matchingFields('password', 'confirmPassword') })
  });

   this.name = this.registerForm.controls.name;
   this.email = this.registerForm.controls.email;

  //  this.password = this.registerForm.controls.password;
  //  this.confirmPassword = this.registerForm.controls.confirmPassword;
  }

  public hasError = (controlName: string, errorName: string) => {
    return this.registerForm.controls[controlName].hasError(errorName);
  }

  public hasError1 = (controlName: string, errorName: string) => {
    const pass = this.registerForm.get('passwords');
    return pass.get(controlName).hasError(errorName);
  }

  public onLogin = () => {
    this.authSandbox.go('auth/login');
  }

  public signup = (registerFormValue) => {
    this.submitted = true;
    if (this.registerForm.valid) {
      this.authSandbox.login(registerFormValue);
    }
  }
}

