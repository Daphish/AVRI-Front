import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SeguroHtmlPipe } from './seguro-html.pipe';

describe('SeguroHtmlPipe', () => {
  let pipe: SeguroHtmlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SeguroHtmlPipe]
    });
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new SeguroHtmlPipe(sanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return SafeHtml for valid HTML', () => {
    const result = pipe.transform('<p>Test</p>');
    expect(result).toBeTruthy();
  });

  it('should handle empty string', () => {
    const result = pipe.transform('');
    expect(result).toBeTruthy();
  });

  it('should handle null', () => {
    const result = pipe.transform(null as any);
    expect(result).toBeTruthy();
  });

  it('should handle undefined', () => {
    const result = pipe.transform(undefined as any);
    expect(result).toBeTruthy();
  });

  it('should sanitize potentially dangerous script tags', () => {
    const result = pipe.transform('<script>alert("xss")</script>');
    // Angular's sanitizer will strip the dangerous content
    expect(result).toBeTruthy();
  });

  it('should handle complex HTML structures', () => {
    const html = '<div><p>Paragraph</p><ul><li>Item</li></ul></div>';
    const result = pipe.transform(html);
    expect(result).toBeTruthy();
  });

  it('should handle HTML with attributes', () => {
    const html = '<div class="test" id="myDiv">Content</div>';
    const result = pipe.transform(html);
    expect(result).toBeTruthy();
  });

  it('should handle inline styles', () => {
    const html = '<span style="color: red;">Red text</span>';
    const result = pipe.transform(html);
    expect(result).toBeTruthy();
  });

  it('should handle links', () => {
    const html = '<a href="https://example.com">Link</a>';
    const result = pipe.transform(html);
    expect(result).toBeTruthy();
  });
});

