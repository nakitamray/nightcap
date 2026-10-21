import { Filter, GlProgram } from 'pixi.js'
import { filterVertex } from './vertex'

// Turns a flipped copy of the street into a puddle reflection. Lights get
// smeared downward (the long streaks you see under lamps on wet asphalt),
// everything wobbles a bit, more so the further it is from the kerb.
const fragment = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;

uniform float uTime;
uniform float uStrength;

void main(void) {
  vec2 uv = vTextureCoord;
  float depth = clamp((uv.y - uInputClamp.y) / (uInputClamp.w - uInputClamp.y), 0.0, 1.0);
  vec2 px = uv * uInputSize.xy;

  float wobble = sin(px.y * 0.42 + uTime * 3.1) * 0.6
    + sin(px.y * 0.11 - uTime * 1.7 + px.x * 0.013) * 0.8
    + sin(px.y * 1.3 + uTime * 5.0 + px.x * 0.05) * 0.25;
  uv.x += wobble * (0.6 + depth * 5.0) * uInputSize.z;

  // smear: sum a handful of taps going back up toward the light source
  vec4 acc = vec4(0.0);
  float total = 0.0;
  float stepPx = 2.0 + depth * 7.0;
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float w = 1.0 - fi / 10.0;
    vec2 tap = uv - vec2(0.0, fi * stepPx * uInputSize.w);
    tap = clamp(tap, uInputClamp.xy, uInputClamp.zw);
    acc += texture(uTexture, tap) * w;
    total += w;
  }
  vec4 color = acc / total;

  // bright stuff survives the trip, dark stuff disappears into the asphalt
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb *= smoothstep(0.05, 0.5, lum) * 1.4;
  color.rgb *= vec3(1.05, 0.92, 0.78);
  color *= (1.0 - depth * 0.8) * uStrength;

  finalColor = color;
}
`

export class WetFilter extends Filter {
  constructor(strength = 0.85) {
    super({
      glProgram: GlProgram.from({ vertex: filterVertex, fragment, name: 'nightcap-wet' }),
      resources: {
        wetUniforms: {
          uTime: { value: 0, type: 'f32' },
          uStrength: { value: strength, type: 'f32' },
        },
      },
    })
  }

  set time(t: number) {
    this.resources.wetUniforms.uniforms.uTime = t
  }
}
