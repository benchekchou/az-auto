import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './components/site-header/site-header';
import { SiteFooter } from './components/site-footer/site-footer';
import { CompareBar } from './components/compare-bar/compare-bar';
import { CarStorageService } from './services/car-storage.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter, CompareBar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('zr-auto');
  protected readonly storage = inject(CarStorageService);
}
