import { DEFAULT_COMPANY_ID, validateDefaultCompanyId } from './company.constants';

describe('company.constants', () => {
  describe('DEFAULT_COMPANY_ID', () => {
    it('deve estar definido', () => {
      expect(DEFAULT_COMPANY_ID).toBeDefined();
    });

    it('deve ser uma string não vazia', () => {
      expect(typeof DEFAULT_COMPANY_ID).toBe('string');
      expect(DEFAULT_COMPANY_ID.length).toBeGreaterThan(0);
    });

    it('deve ser um UUID válido', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(DEFAULT_COMPANY_ID).toMatch(uuidRegex);
    });
  });

  describe('validateDefaultCompanyId', () => {
    it('não deve lançar erro quando DEFAULT_COMPANY_ID está definido', () => {
      expect(() => validateDefaultCompanyId()).not.toThrow();
    });
  });
});
