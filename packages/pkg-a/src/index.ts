import { greet } from '@repro/pkg-b';

export const welcome = (name: string): string => greet(name) + ' Welcome!';
