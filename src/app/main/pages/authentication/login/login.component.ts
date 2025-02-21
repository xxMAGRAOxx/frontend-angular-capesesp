import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { LoginServices } from './login.service';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;

    processing = false;
    rememberMe: boolean;

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: FormBuilder,
        private _fuseProgressBarService: FuseProgressBarService,
        private _loginServices: LoginServices
    ) {
        // Configure the layout
        this._fuseConfigService.config = {
            layout: {
                navbar: {
                    hidden: true
                },
                toolbar: {
                    hidden: true
                },
                footer: {
                    hidden: true
                },
                sidepanel: {
                    hidden: true
                }
            }
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.rememberMe = localStorage.getItem('matricula') ? true : false;

        let loginForm = this._formBuilder.group({
            matricula: ['', [Validators.required]],
            password: ['', Validators.required],
            rememberMe: [this.rememberMe]
        });

        // Matrícula somente números
        loginForm.get('matricula').valueChanges.subscribe((value) => {
            loginForm.get('matricula').setValue(value.replace(/\D/g, ''), { emitEvent: false });
        });

        loginForm.updateValueAndValidity();

        this.loginForm = loginForm;
    }

    login(): void {
        if (this.loginForm.valid) {
            this.processing = true;
            this._fuseProgressBarService.show();
            console.log('Logando...');

            let rememberMe = this.loginForm.get('rememberMe').value;
            if (rememberMe) {
                localStorage.setItem('matricula', this.loginForm.get('matricula').value);
            }

            this.authenticate();
        }
    }

    authenticate() {
        this._loginServices.authenticate(this.loginForm.value).subscribe(data => {
            if (data.status == 200) {
                localStorage.removeItem('cruzzyapp_translations');
                sessionStorage.setItem('cruzzyapp_auth-token', data.token);
                if (data.type == 'administrator') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/employee';
                }
            } else if (data.status == 401) {
                // this._snackBar.open(this._translate.instant('msg_senhaInvalida'), 'X', { duration: 60000, panelClass: 'error-snackbar' });
                this.processing = false;
            } else if (data.status == 406) {
                // this._snackBar.open('Em manutenção, aguarde alguns instantes e tente novamente', 'X', { duration: 60000, panelClass: 'error-snackbar' });
                this.processing = false;
            } else {
                // this._snackBar.open(this._translate.instant('msg_erroPadrao'), 'X', { duration: 60000, panelClass: 'error-snackbar' });
                this.processing = false;
            }
            this._fuseProgressBarService.hide();
        }, error => {
            this._fuseProgressBarService.hide();
            this.processing = false;
            // this.handleErrorCode(error);
        });
    }
}
