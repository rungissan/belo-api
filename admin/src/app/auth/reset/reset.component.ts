import { ChangeDetectionStrategy, OnInit, Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  FormControl
} from '@angular/forms';

import { AuthSandbox } from '../auth.sandbox';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetComponent implements OnInit {
  public submitted = false;
  public email: AbstractControl;
  public resetForm: FormGroup;

  constructor(private fb: FormBuilder, public authSandbox: AuthSandbox) {}

  ngOnInit() {
    this.resetForm = this.fb.group({
      email: new FormControl('', [Validators.required, this.authSandbox.validationService.validateEmail])
   });
    this.email = this.resetForm.controls.email;

  }

  public hasError = (controlName: string, errorName: string) => {
    return this.resetForm.controls[controlName].hasError(errorName);
  }

  public onCancel = () => {
    // this.location.back();
  }

  public onSubmit = (resetFormValue) => {
    this.submitted = true;
    if (this.resetForm.valid) {
      this.authSandbox.login(resetFormValue);
    }
  }
}
