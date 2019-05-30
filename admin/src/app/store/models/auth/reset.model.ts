export class ResetForm {
  public email: string;

  constructor(resetForm: any) {
    this.email    = resetForm.email   || '';
  }
}
