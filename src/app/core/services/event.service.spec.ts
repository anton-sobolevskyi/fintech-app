import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { EventService } from './event.service';

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose emitted events on the stream', async () => {
    const event = service.stream$;
    const values: unknown[] = [];
    event.subscribe((v) => values.push(v));
    service.emit('account.topup', { accountId: 'a', amount: 5 });
    expect(values).toHaveLength(1);
    expect(values[0]).toMatchObject({ type: 'account.topup', payload: { accountId: 'a', amount: 5 } });
  });

  it('should only emit events matching the subscribed types', () => {
    const received: unknown[] = [];
    service.on('account.created', 'account.transfer').subscribe((e) => received.push(e));
    service.emit('account.topup');
    service.emit('account.created', { id: '1' });
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ type: 'account.created', payload: { id: '1' } });
  });

  it('should emit an event with a numeric timestamp', async () => {
    const eventPromise = firstValueFrom(service.on('account.updated'));
    service.emit('account.updated');
    const event = await eventPromise;
    expect(typeof event.at).toBe('number');
  });
});
