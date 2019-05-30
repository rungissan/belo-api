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
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  public submitted = false;
  public email: AbstractControl;
  public password: AbstractControl;
  public loginForm: FormGroup;

  constructor(private fb: FormBuilder, public authSandbox: AuthSandbox) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: new FormControl('', [Validators.required, this.authSandbox.validationService.validateEmail]),
      password: new FormControl('', [Validators.required, Validators.minLength(4)])
   });
    this.email = this.loginForm.controls.email;
    this.password = this.loginForm.controls.password;
  }

  public hasError = (controlName: string, errorName: string) => {
    return this.loginForm.controls[controlName].hasError(errorName);
  }

  public onRegistration = () => {
    this.authSandbox.go('auth/register');
    // this.location.back();
  }

  public signin = (loginFormValue) => {
    this.submitted = true;
    if (this.loginForm.valid) {
      this.authSandbox.login(loginFormValue);
    }
  }
}
