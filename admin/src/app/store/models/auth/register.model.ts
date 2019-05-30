export class RegisterForm {
  public name: string;
  public email: string;
  public password: string;
  public confirmPassword: string;

  constructor(registerForm: any) {
    this.name = registerForm.email || '';
    this.email = registerForm.email || '';
    this.password = registerForm.password || '';
    this.confirmPassword = registerForm.confirmPassword || '';
  }
}
