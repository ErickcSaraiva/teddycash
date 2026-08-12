import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SEASONAL_CAMPAIGNS, contrastRatio, getGregorianEaster, getNthWeekday, resolveCampaignDate,
  resolveCampaignPeriod, selectSeasonalCampaign, type SeasonalCampaign,
} from './seasonalCampaigns';

const atManaus = (date: string, time = '12:00:00') => new Date(`${date}T${time}-04:00`);
const campaign = (id: string) => SEASONAL_CAMPAIGNS.find((item) => item.id === id)!;

test('usa o tema padrão fora de uma campanha ativa', () => {
  assert.equal(selectSeasonalCampaign(atManaus('2026-02-10')).id, 'default');
});

test('inclui início e fim e encerra o período na virada local', () => {
  assert.equal(selectSeasonalCampaign(atManaus('2026-06-01', '00:00:00')).id, 'festa-junina');
  assert.equal(selectSeasonalCampaign(atManaus('2026-06-30', '23:59:59')).id, 'festa-junina');
  assert.equal(selectSeasonalCampaign(atManaus('2026-07-01', '00:00:00')).id, 'default');
});

test('resolve conflito pela maior prioridade independentemente da ordem', () => {
  const low = { ...campaign('halloween'), id: 'low', priority: 1 };
  const high = { ...campaign('halloween'), id: 'high', priority: 99 };
  assert.equal(selectSeasonalCampaign(atManaus('2026-10-31'), [low, high]).id, 'high');
  assert.equal(selectSeasonalCampaign(atManaus('2026-10-31'), [high, low]).id, 'high');
});

test('ignora campanhas desativadas', () => {
  const disabled: SeasonalCampaign = { ...campaign('halloween'), active: false };
  assert.equal(selectSeasonalCampaign(atManaus('2026-10-31'), [disabled]).id, 'default');
});

test('virada de data respeita America/Manaus', () => {
  assert.equal(selectSeasonalCampaign(new Date('2026-11-01T03:59:59.999Z')).id, 'halloween');
  assert.equal(selectSeasonalCampaign(new Date('2026-11-01T04:00:00.000Z')).id, 'default');
});

test('calcula Carnaval e Corpus Christi a partir da Páscoa', () => {
  assert.deepEqual(getGregorianEaster(2026), { year: 2026, month: 4, day: 5 });
  assert.deepEqual(resolveCampaignPeriod(campaign('carnival').schedule, 2026), {
    startsOn: { year: 2026, month: 2, day: 14 }, endsOn: { year: 2026, month: 2, day: 17 },
  });
  assert.deepEqual(resolveCampaignPeriod(campaign('corpus-christi').schedule, 2026).startsOn, { year: 2026, month: 6, day: 4 });
});

test('calcula o segundo domingo de maio e agosto', () => {
  assert.deepEqual(getNthWeekday(2026, 5, 0, 2), { year: 2026, month: 5, day: 10 });
  assert.deepEqual(getNthWeekday(2026, 8, 0, 2), { year: 2026, month: 8, day: 9 });
});

test('calcula a quarta quinta-feira de novembro', () => {
  assert.deepEqual(getNthWeekday(2026, 11, 4, 4), { year: 2026, month: 11, day: 26 });
});

test('simula data sem modificar o relógio ou a Date global', () => {
  const realClock = new Date('2026-02-10T12:00:00.000Z');
  const simulated = resolveCampaignDate('2026-12-25', realClock);
  assert.equal(selectSeasonalCampaign(simulated).id, 'christmas');
  assert.equal(realClock.toISOString(), '2026-02-10T12:00:00.000Z');
  assert.equal(resolveCampaignDate('inválida', realClock), realClock);
});

test('temas completos mantêm contraste mínimo para texto normal', () => {
  for (const id of ['festa-junina', 'halloween', 'christmas']) {
    const colors = campaign(id).colors;
    assert.ok(contrastRatio(colors.text, colors.background) >= 4.5, `${id}: texto`);
    assert.ok(contrastRatio(colors.accent, colors.background) >= 4.5, `${id}: destaque`);
  }
});
