import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./landing/landing-page.component').then(m => m.LandingPageComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'oauth-success',
    loadComponent: () =>
      import('./auth/oauth-success/oauth-success.component').then(m => m.OauthSuccessComponent),
  },
  {
    path: 'verify',
    loadComponent: () =>
      import('./auth/verify/verify.component').then(m => m.VerifyComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'test-router',
    loadComponent: () =>
      import('./debug/router-test.component/router-test.component.component').then(
        m => m.RouterTestComponent
      ),
  },
  {
    path: 'matches',
    loadComponent: () =>
      import('./tennis/matches/matches.component').then(m => m.MatchesComponent),
  },
  {
    path: 'players',
    loadComponent: () =>
      import('./tennis/players/players.component').then(m => m.PlayersComponent),
  },
  {
    path: 'tournaments',
    loadComponent: () =>
      import('./tennis/tournaments/tournaments.component').then(m => m.TournamentEventsComponent),
  }
];