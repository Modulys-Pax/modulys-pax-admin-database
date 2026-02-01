import { DEFAULT_COMPANY_ID } from '../company.constants';

describe('company.constants', () => {
  describe('DEFAULT_COMPANY_ID', () => {
    it('deve estar definido', () => {
      expect(DEFAULT_COMPANY_ID).toBeDefined();
    });

    it('deve ser um UUID válido', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(DEFAULT_COMPANY_ID).toMatch(uuidRegex);
    });

    it('deve ter o valor correto', () => {
      expect(DEFAULT_COMPANY_ID).toBe('a4771684-cd63-4ecd-8771-545ddb937278');
    });
  });
});
