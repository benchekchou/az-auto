import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarStorageService } from '../../services/car-storage.service';
import { resizeImage } from '../../services/image.util';
import { CarInput, CARBURANTS, TRANSMISSIONS, STATUTS } from '../../models/car.model';

const MAX_PHOTOS = 5;

@Component({
  selector: 'app-car-form',
  imports: [ReactiveFormsModule],
  templateUrl: './car-form.html',
  styleUrl: './car-form.scss',
})
export class CarForm {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly storage = inject(CarStorageService);
  private readonly fb = inject(FormBuilder);

  readonly carburants = CARBURANTS;
  readonly transmissions = TRANSMISSIONS;
  readonly statuts = STATUTS;

  private readonly editId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = computed(() => this.editId !== null);

  readonly photos = signal<string[]>([]);
  readonly submitError = signal<string | null>(null);
  readonly photosError = signal<string | null>(null);
  readonly isProcessingPhotos = signal(false);

  readonly form = this.fb.nonNullable.group({
    marque: ['', Validators.required],
    modele: ['', Validators.required],
    annee: [new Date().getFullYear(), [Validators.required, Validators.min(1950), Validators.max(2100)]],
    prix: [0, [Validators.required, Validators.min(0)]],
    kilometrage: [0, [Validators.required, Validators.min(0)]],
    carburant: [this.carburants[0], Validators.required],
    transmission: [this.transmissions[0], Validators.required],
    couleur: [''],
    description: [''],
    statut: [this.statuts[0], Validators.required],
  });

  constructor() {
    if (this.editId) {
      const car = this.storage.getById(this.editId);
      if (!car) {
        this.router.navigate(['/catalogue']);
        return;
      }
      this.form.patchValue(car);
      this.photos.set(car.photos);
    }
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;

    this.photosError.set(null);

    if (this.photos().length + files.length > MAX_PHOTOS) {
      this.photosError.set(`Maximum ${MAX_PHOTOS} photos par annonce.`);
      return;
    }

    this.isProcessingPhotos.set(true);
    try {
      const resized = await Promise.all(files.map((file) => resizeImage(file)));
      this.photos.update((current) => [...current, ...resized]);
    } catch {
      this.photosError.set("Une des images n'a pas pu être traitée.");
    } finally {
      this.isProcessingPhotos.set(false);
    }
  }

  removePhoto(index: number): void {
    this.photos.update((current) => current.filter((_, i) => i !== index));
  }

  submit(): void {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.photos().length === 0) {
      this.photosError.set('Ajoutez au moins une photo.');
      return;
    }

    const input: CarInput = { ...this.form.getRawValue(), photos: this.photos() };

    try {
      if (this.isEdit() && this.editId) {
        this.storage.update(this.editId, input);
        this.router.navigate(['/voitures', this.editId]);
      } else {
        const car = this.storage.add(input);
        this.router.navigate(['/voitures', car.id]);
      }
    } catch (err) {
      this.submitError.set(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    }
  }

  cancel(): void {
    if (this.isEdit() && this.editId) {
      this.router.navigate(['/voitures', this.editId]);
    } else {
      this.router.navigate(['/catalogue']);
    }
  }
}
