import { MonoColour } from '@railmapgen/rmg-palette-resources';
import { CityCode, Theme } from './constants';

/**
 * Default colours of the yauj styles: Hong Kong Kwun Tong Line for metro, Hong Kong Island Tram for light rail and
 * Hong Kong high speed rail for rail. Hex values are the latest ones used on the yauj maps.
 */
export const YAUJ_METRO_COLOR: Theme = [CityCode.Hongkong, 'ktl', '#01a040', MonoColour.white];
export const YAUJ_LIGHT_RAIL_COLOR: Theme = [CityCode.Hongkong, 'tramways', '#007549', MonoColour.white];
export const YAUJ_RAIL_COLOR: Theme = [CityCode.Hongkong, 'hsr', '#9d948b', MonoColour.white];
