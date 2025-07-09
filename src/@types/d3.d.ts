declare module 'd3-scale' {
  export interface ScaleSequential<Output> {
    (value: number): Output;
    domain(): [number, number];
    domain(domain: [number, number]): this;
    clamp(): boolean;
    clamp(clamp: boolean): this;
    interpolator(): (t: number) => Output;
    interpolator(interpolator: (t: number) => Output): this;
    range(): [Output, Output];
    range(range: [Output, Output]): this;
    copy(): ScaleSequential<Output>;
  }

  export function scaleSequential<Output>(
    interpolator?: (t: number) => Output
  ): ScaleSequential<Output>;
}

declare module 'd3-scale-chromatic' {
  export function interpolateRdYlBu(t: number): string;
  export function interpolateViridis(t: number): string;
  export function interpolateInferno(t: number): string;
  export function interpolatePlasma(t: number): string;
  export function interpolateWarm(t: number): string;
  export function interpolateCool(t: number): string;
  export function interpolateSpectral(t: number): string;
} 