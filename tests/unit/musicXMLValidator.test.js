// Unit test for MusicXMLValidator
import MusicXMLValidator from '../../src/converter/MusicXMLValidator.js';

describe('MusicXMLValidator', () => {
  it('should detect missing required attributes', () => {
    const xml = `
      <score version="4.0">
        <part id="P1">
          <measure number="1" width="100">
            <note pitch="C4" duration="480" voice="1" />
          </measure>
        </part>
      </score>
    `;
    const validator = new MusicXMLValidator();
    const errors = validator.validate(xml);
    expect(errors.length).toBe(1); // missing 'staff' in <note>
    expect(errors[0]).toMatch(/Missing attribute 'staff'/);
  });
  it('should pass when all required attributes are present', () => {
    const xml = `
      <score version="4.0">
        <part id="P1">
          <measure number="1" width="100">
            <note pitch="C4" duration="480" voice="1" staff="1" />
          </measure>
        </part>
      </score>
    `;
    const validator = new MusicXMLValidator();
    const errors = validator.validate(xml);
    expect(errors.length).toBe(0);
  });
});
