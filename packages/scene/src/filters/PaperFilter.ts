import { Filter, GlProgram } from 'pixi.js'
import { filterVertex } from './vertex'

// The "printed poster" pass that goes over the whole frame:
//  - fibrous paper grain (two scales of value noise, stretched a little so it
//    reads as fibres instead of TV static)
//  - slightly uneven ink, like a riso print that didn't quite cover
//  - lifted blacks, so the darks read as printed ink
//  - a warm grade on everything lamp-lit
//  - vignette
const fragment = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;

uniform float uTime;
uniform float uGrain;
uniform float uVignette;
uniform vec2 uScreen;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main(void) {
  vec4 color = texture(uTexture, vTextureCoord);
  vec2 px = vTextureCoord * uInputSize.xy + uOutputFrame.xy;
  vec2 uv = px / uScreen;

  // paper fibres don't move. the fine grain flickers a tiny bit, like film.
  float fibres = noise(px * vec2(0.9, 0.32)) * 0.6 + noise(px * vec2(0.18, 0.07)) * 0.4;
  float flicker = hash(px + floor(uTime * 12.0));
  float grain = mix(fibres, flicker, 0.25) - 0.5;

  // blotchy ink density at a much larger scale
  float blotch = noise(px * 0.006) * 0.5 + noise(px * 0.017) * 0.5;

  vec3 c = color.rgb;
  c *= 0.9 + blotch * 0.18;
  c += grain * uGrain * (0.35 + c * 0.9);

  // lift the blacks a touch so nothing is ever flat #000 -- ink on paper, not a void
  vec3 paperDark = vec3(0.02, 0.022, 0.05);
  c = paperDark + c * (1.0 - paperDark);

  // warm the mids and highlights toward lamplight; the deep blues stay put
  float lumi = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, c * vec3(1.12, 0.97, 0.78), smoothstep(0.08, 0.5, lumi));

  float d = distance(uv, vec2(0.5, 0.55));
  c *= 1.0 - smoothstep(0.35, 0.95, d) * uVignette;

  finalColor = vec4(c, 1.0);
}
`

export class PaperFilter extends Filter {
  constructor() {
    super({
      glProgram: GlProgram.from({ vertex: filterVertex, fragment, name: 'nightcap-paper' }),
      resources: {
        paperUniforms: {
          uTime: { value: 0, type: 'f32' },
          uGrain: { value: 0.16, type: 'f32' },
          uVignette: { value: 0.55, type: 'f32' },
          uScreen: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
        },
      },
    })
  }

  private get u() {
    return this.resources.paperUniforms.uniforms
  }

  set time(t: number) {
    this.u.uTime = t
  }

  setScreen(width: number, height: number) {
    const s = this.u.uScreen as Float32Array
    s[0] = width
    s[1] = height
  }
}
