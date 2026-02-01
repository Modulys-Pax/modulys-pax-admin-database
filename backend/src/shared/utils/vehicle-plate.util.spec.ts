import { getPrimaryPlate } from './vehicle-plate.util';

describe('vehicle-plate.util', () => {
  describe('getPrimaryPlate', () => {
    it('deve retornar placa CAVALO quando existir', () => {
      const vehicle = {
        plates: [
          { type: 'CARRETA', plate: 'CCC-1234' },
          { type: 'CAVALO', plate: 'AAA-1234' },
          { type: 'REBOQUE', plate: 'BBB-1234' },
        ],
      };

      expect(getPrimaryPlate(vehicle)).toBe('AAA-1234');
    });

    it('deve retornar primeira placa quando não há CAVALO', () => {
      const vehicle = {
        plates: [
          { type: 'CARRETA', plate: 'CCC-1234' },
          { type: 'REBOQUE', plate: 'BBB-1234' },
        ],
      };

      expect(getPrimaryPlate(vehicle)).toBe('CCC-1234');
    });

    it('deve retornar string vazia quando não há placas', () => {
      const vehicle = { plates: [] };
      expect(getPrimaryPlate(vehicle)).toBe('');
    });

    it('deve retornar string vazia quando plates é undefined', () => {
      const vehicle = {};
      expect(getPrimaryPlate(vehicle)).toBe('');
    });

    it('deve funcionar com apenas uma placa', () => {
      const vehicle = {
        plates: [{ type: 'TRATOR', plate: 'XYZ-9876' }],
      };

      expect(getPrimaryPlate(vehicle)).toBe('XYZ-9876');
    });
  });
});
