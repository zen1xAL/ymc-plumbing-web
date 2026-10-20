import {
  CreateJobInput,
  TaskLocation
} from '../models/task.model';
import {
  DEFAULT_CITY,
  DEFAULT_ZIP,
  DEFAULT_JOB_DURATION_HOURS,
  CITY_COORDINATES,
  DEFAULT_COORDINATES
} from '../models/constants';

export interface CreateJobFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  jobType: string;
  source: string;
  address: string;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  area?: string | null;
  assignedTechnician: string;
  scheduledDate?: string | null;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  description?: string | null;
}

export class JobMapper {
  static calculateCoordinates(address: string, city?: string | null): TaskLocation {
    const rawCity = (city || DEFAULT_CITY).trim().toLowerCase();
    const baseCoords = CITY_COORDINATES[rawCity] ?? DEFAULT_COORDINATES;

    const fullStr = `${address.trim().toLowerCase()}_${rawCity}`;
    let hash = 0;
    for (let i = 0; i < fullStr.length; i++) {
      hash = (hash << 5) - hash + fullStr.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    const latJitter = (((absHash % 1000) / 1000) - 0.5) * 0.03;
    const lngJitter = (((Math.floor(absHash / 1000) % 1000) / 1000) - 0.5) * 0.03;

    const fullAddress = [
      address.trim(),
      city?.trim() || DEFAULT_CITY,
      DEFAULT_ZIP
    ].filter(Boolean).join(', ');

    return {
      address: fullAddress,
      latitude: Number((baseCoords.lat + latJitter).toFixed(5)),
      longitude: Number((baseCoords.lng + lngJitter).toFixed(5))
    };
  }

  static mapFormDataToInput(formData: CreateJobFormData): CreateJobInput {
    let startDate: Date;
    if (formData.scheduledDate && formData.scheduledStartTime) {
      startDate = new Date(`${formData.scheduledDate}T${formData.scheduledStartTime}`);
    } else if (formData.scheduledStart) {
      startDate = new Date(formData.scheduledStart);
    } else {
      startDate = new Date();
    }

    let endDate: Date;
    if (formData.scheduledDate && formData.scheduledEndTime) {
      endDate = new Date(`${formData.scheduledDate}T${formData.scheduledEndTime}`);
    } else if (formData.scheduledEnd) {
      endDate = new Date(formData.scheduledEnd);
    } else {
      endDate = new Date(startDate.getTime() + DEFAULT_JOB_DURATION_HOURS * 60 * 60 * 1000);
    }

    const city = formData.city?.trim() || DEFAULT_CITY;
    const zipCode = formData.zipCode?.trim() || DEFAULT_ZIP;
    const fullAddressParts = [formData.address.trim(), city];
    if (formData.state?.trim()) {
      fullAddressParts.push(formData.state.trim());
    }
    fullAddressParts.push(zipCode);
    const fullAddress = fullAddressParts.filter(Boolean).join(', ');

    const location = this.calculateCoordinates(formData.address, city);
    location.address = fullAddress;

    return {
      title: `${formData.jobType} – ${formData.firstName.trim()} ${formData.lastName.trim()}`,
      description: formData.description?.trim() || `Выполнение работ по заявке: ${formData.jobType}`,
      dueDate: startDate.toISOString(),
      location,
      client: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined
      },
      jobType: formData.jobType,
      source: formData.source,
      assignedTechnician: formData.assignedTechnician,
      scheduledTime: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };
  }
}
