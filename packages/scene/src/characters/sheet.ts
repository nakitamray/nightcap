import { Application, Graphics } from 'pixi.js'
import type { Avatar } from './avatar'
import { drawCharacter, type Pose } from './draw'

/**
 * For dev mode: a crowd of people in a grid, standing, on seats and on the
 * floor, to check every outfit at once. Returns a function that tears it down.
 */
export async function castSheet(host: HTMLElement, people: { avatar: Avatar; pose: Pose }[]) {
  const app = new Application()
  await app.init({ resizeTo: host, background: 0x2f6b66, antialias: true })
  host.appendChild(app.canvas)
  const ticks: ((t: number) => void)[] = []
  const cols = 10
  people.forEach(({ avatar, pose }, i) => {
    const x = 70 + (i % cols) * 130
    const y = 180 + Math.floor(i / cols) * 190
    const g = new Graphics().rect(x - 60, y, 120, 4).fill(0x1e1a1c)
    if (pose === 'sit') g.rect(x - 52, y - 40, 104, 40).fill(0x8a4a3a)
    app.stage.addChild(g)
    const p = drawCharacter(avatar, { pose, animate: (t) => ticks.push(t) })
    p.scale.set(0.5)
    p.position.set(x, pose === 'sit' ? y - 40 : y)
    app.stage.addChild(p)
  })
  let time = 0
  app.ticker.add((t) => {
    time += t.deltaMS / 1000
    for (const tick of ticks) tick(time)
  })
  return () => app.destroy({ removeView: true }, { children: true })
}
