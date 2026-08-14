'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@iliad/ui';
import { CloudSun, Loader2, RefreshCw, Radio, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

interface WeatherSnapshot {
  timestamp: string;
  temperatureC: number;
  windSpeedKph: number;
  weatherCode: number;
  precipProbability?: number;
}

interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  weather_code: number[];
  wind_speed_10m: number[];
}

interface ForecastResponse {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  hourly: HourlyForecast;
}

interface MarketPreset {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

const MARKET_PRESETS: MarketPreset[] = [
  { id: 'boise', label: 'Boise, ID', latitude: 43.615, longitude: -116.2023 },
  { id: 'dallas', label: 'Dallas, TX', latitude: 32.7767, longitude: -96.797 },
  { id: 'phoenix', label: 'Phoenix, AZ', latitude: 33.4484, longitude: -112.074 },
];

function weatherCodeLabel(code: number): string {
  if ([0].includes(code)) return 'clear sky';
  if ([1, 2, 3].includes(code)) return 'partly cloudy';
  if ([45, 48].includes(code)) return 'foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'rain';
  if ([71, 73, 75, 77].includes(code)) return 'snow';
  if ([80, 81, 82].includes(code)) return 'showers';
  if ([95, 96, 99].includes(code)) return 'thunderstorms';
  return 'mixed conditions';
}

function toBulletin(
  snapshot: WeatherSnapshot,
  nextHours: WeatherSnapshot[],
  marketLabel: string,
): string {
  const currentLabel = weatherCodeLabel(snapshot.weatherCode);
  const warmest = nextHours.reduce(
    (max, item) => (item.temperatureC > max.temperatureC ? item : max),
    nextHours[0] ?? snapshot,
  );
  const rainRisk = Math.max(
    ...nextHours.map((item) => item.precipProbability ?? 0),
    snapshot.precipProbability ?? 0,
  );

  return [
    `Good ${new Date(snapshot.timestamp).getHours() < 12 ? 'morning' : 'afternoon'}, this is your ${marketLabel} weather update.`,
    `Right now we're seeing ${Math.round(snapshot.temperatureC)} degrees with ${currentLabel} and winds around ${Math.round(snapshot.windSpeedKph)} kilometers per hour.`,
    `Over the next few hours, temperatures peak near ${Math.round(warmest.temperatureC)} degrees.`,
    rainRisk >= 40
      ? `There is a ${Math.round(rainRisk)} percent chance of precipitation, so keep rain gear handy.`
      : `Precipitation risk stays low, with only about a ${Math.round(rainRisk)} percent chance.`,
    'More updates at the top of the hour.',
  ].join(' ');
}

export function WeatherWorkspacePage() {
  const [selectedMarket, setSelectedMarket] = useState<MarketPreset>(MARKET_PRESETS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<WeatherSnapshot | null>(null);
  const [nextHours, setNextHours] = useState<WeatherSnapshot[]>([]);

  const bulletin = useMemo(() => {
    if (!current) {
      return '';
    }

    return toBulletin(current, nextHours, selectedMarket.label);
  }, [current, nextHours, selectedMarket.label]);

  const loadForecast = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        latitude: selectedMarket.latitude.toString(),
        longitude: selectedMarket.longitude.toString(),
        current: 'temperature_2m,wind_speed_10m,weather_code',
        hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m',
        forecast_hours: '8',
        timezone: 'auto',
      });

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Forecast request failed (${response.status})`);
      }

      const payload = (await response.json()) as ForecastResponse;
      const snapshot: WeatherSnapshot = {
        timestamp: payload.current.time,
        temperatureC: payload.current.temperature_2m,
        windSpeedKph: payload.current.wind_speed_10m,
        weatherCode: payload.current.weather_code,
      };

      const hourly: WeatherSnapshot[] = payload.hourly.time.slice(0, 6).map((time, index) => ({
        timestamp: time,
        temperatureC: payload.hourly.temperature_2m[index] ?? snapshot.temperatureC,
        windSpeedKph: payload.hourly.wind_speed_10m[index] ?? snapshot.windSpeedKph,
        weatherCode: payload.hourly.weather_code[index] ?? snapshot.weatherCode,
        precipProbability: payload.hourly.precipitation_probability[index] ?? 0,
      }));

      setCurrent(snapshot);
      setNextHours(hourly);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load weather forecast');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="odyssey-panel border-border/80">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="uppercase tracking-[0.16em]">
              live weather
            </Badge>
            <Badge variant="outline">real forecast api</Badge>
          </div>
          <CardTitle className="text-3xl tracking-tight text-foreground">
            Weather Operations Desk
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Pull live conditions, review near-term outlook, and generate an on-air bulletin script.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {MARKET_PRESETS.map((market) => (
              <Button
                key={market.id}
                size="sm"
                variant={market.id === selectedMarket.id ? 'default' : 'outline'}
                onClick={() => setSelectedMarket(market)}
              >
                {market.label}
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={loadForecast} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh Forecast</span>
            </Button>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <TriangleAlert className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Current temp
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {current ? `${Math.round(current.temperatureC)} C` : '--'}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Current wind
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {current ? `${Math.round(current.windSpeedKph)} kph` : '--'}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Conditions
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {current ? weatherCodeLabel(current.weatherCode) : '--'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="odyssey-panel border-border/80">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Next 6 Hours</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {nextHours.length === 0 ? (
            <p className="text-sm text-muted-foreground">Load a forecast to view hourly outlook.</p>
          ) : (
            nextHours.map((hour) => (
              <div
                key={hour.timestamp}
                className="rounded-xl border border-border/60 bg-background/55 p-3 text-sm"
              >
                <p className="font-medium text-foreground">
                  {new Date(hour.timestamp).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
                <p className="mt-1 text-muted-foreground">{Math.round(hour.temperatureC)} C</p>
                <p className="text-muted-foreground">{weatherCodeLabel(hour.weatherCode)}</p>
                <p className="text-muted-foreground">
                  Rain {Math.round(hour.precipProbability ?? 0)}%
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="odyssey-panel border-border/80">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">On-Air Bulletin Draft</CardTitle>
          </div>
          <CardDescription>
            Generated from live forecast data. Edit and route to your production lane.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="min-h-36 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={bulletin}
            readOnly
            placeholder="Load forecast data to generate a bulletin."
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!bulletin) return;

                try {
                  await navigator.clipboard.writeText(bulletin);
                  setCopyStatus('Bulletin copied to clipboard.');
                } catch {
                  setCopyStatus('Copy failed. You can still select the text manually.');
                }
              }}
              disabled={!bulletin}
            >
              Copy Bulletin Text
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/audio-playground">Send To Audio Playground</Link>
            </Button>
          </div>
          {copyStatus ? <p className="text-xs text-muted-foreground">{copyStatus}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
