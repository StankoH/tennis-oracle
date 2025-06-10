import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-router-test',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div style="padding: 1rem; border: 1px solid gray; margin: 1rem;">
      <p>Test komponenta za <code>routerLink</code></p>
      <a routerLink="/login" style="color: blue; text-decoration: underline;">Idi na /login</a>
    </div>
  `
})
export class RouterTestComponent {}
