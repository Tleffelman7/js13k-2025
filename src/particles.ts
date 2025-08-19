// "🧀" particles

export function create() {
  return [] as {
    x: number;
    y: number;
    dx: number;
    dy: number;
    lifetime: number
    totalLifetime: number;
  }[]
}

export function update(particles: ReturnType<typeof create>, dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.dx * dt / 10;
    p.y += p.dy * dt / 10;
    p.lifetime += dt;

    if (p.lifetime >= p.totalLifetime) {
      particles.splice(i, 1); // Remove particle if lifetime exceeded
    }
  }
}

export function draw(
  ctx: CanvasRenderingContext2D,
  particles: ReturnType<typeof create>
) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const p of particles) {
    ctx.globalAlpha = 1 - (p.lifetime / p.totalLifetime);
    ctx.fillText("🧀", p.x, p.y);
  }
  ctx.globalAlpha = 1;
}

export function addParticle(
  particles: ReturnType<typeof create>,
  x: number,
  y: number,
  dx: number,
  dy: number,
  lifetime: number
) {
  particles.push({
    x,
    y,
    dx,
    dy,
    lifetime: 0,
    totalLifetime: lifetime
  });
}
