import { Clock, Route } from "lucide-react";
import type { ExpressionSpecification, Map as MapLibreMap } from "maplibre-gl";
import * as React from "react";
import {
  MapArc,
  type MapArcDatum,
  MapControls,
  MapMarker,
  MapPopup,
  MarkerContent,
  MarkerTooltip,
  Map as TourMap,
  useMap,
} from "@/components/ui/map";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type TourMapStopSource = {
  id: string;
  title: string;
  duration: string;
  routeText: string;
  description: string;
  latitude: number;
  longitude: number;
};

type TourMapStop = TourMapStopSource & {
  day: string;
  dayNumber: string;
};

interface TourRouteSegment extends MapArcDatum {
  id: string;
  label: string;
  from: [number, number];
  to: [number, number];
  fromStop: TourMapStop;
  toStop: TourMapStop;
  color: string;
}

const tourMapStopsSource: TourMapStopSource[] = [
  {
    id: "day-01-arequipa",
    title: "Arequipa - Recorrido peatonal por la ciudad",
    duration: "8:00 am - 2:00 pm",
    routeText: "City Tour",
    description:
      "Recorrido por la Plaza de Armas, miradores y calles historicas antes de cerrar la primera jornada en Arequipa.",
    latitude: -16.3959,
    longitude: -71.5369,
  },
  {
    id: "day-02-colca",
    title: "Arequipa - Canon del Colca",
    duration: "7:00 am - 5:00 pm",
    routeText: "Viaje en bus",
    description:
      "Salida desde Arequipa hacia el valle del Colca con paradas panoramicas y tiempo para aclimatacion en ruta.",
    latitude: -15.6094,
    longitude: -71.9054,
  },
  {
    id: "day-03-puno",
    title: "Traslado desde el Canon del Colca - Puno",
    duration: "8:00 am - 2:00 pm",
    routeText: "Viaje en bus",
    description:
      "Ruta escenica desde el Colca hacia Puno atravesando paisajes altoandinos y paradas breves durante el traslado.",
    latitude: -15.8402,
    longitude: -70.0219,
  },
  {
    id: "day-04-uros-taquile",
    title: "Puno - Islas Flotantes de los Uros - Taquile - Puno",
    duration: "7:30 am - 4:00 pm",
    routeText: "Navegacion en lago",
    description:
      "Visita a las islas flotantes de los Uros y Taquile para conocer comunidades locales y volver a Puno por la tarde.",
    latitude: -15.7658,
    longitude: -69.6847,
  },
  {
    id: "day-05-puno",
    title: "Puno despedida",
    duration: "9:00 am - 12:00 pm",
    routeText: "Cierre del tour",
    description:
      "Manana libre en Puno para organizar la salida, ultimas compras o conexion con el siguiente destino.",
    latitude: -15.835,
    longitude: -70.027,
  },
];

const routeColors = ["#2563eb", "#16a34a", "#f59e0b", "var(--secondary)"];
const TOUR_MAP_CENTER: [number, number] = [-70.76, -15.98];

const dayPrefixes: Record<Lang, string> = {
  es: "DIA",
  en: "DAY",
  pt: "DIA",
};

const glassPanelClass =
  "bg-white/72 text-slate-900 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.72)] backdrop-blur-2xl ring-0";

function FitTourBounds({
  bounds,
}: {
  bounds: [[number, number], [number, number]];
}) {
  const { map } = useMap();

  React.useEffect(() => {
    if (!map) return;

    map.fitBounds(bounds, {
      padding: { top: 72, right: 72, bottom: 72, left: 72 },
      maxZoom: 8.4,
      duration: 0,
    });
  }, [bounds, map]);

  return null;
}

function Pin({
  active,
  number,
  label,
}: {
  active: boolean;
  number: string;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex items-center justify-center rounded-full text-sm font-extrabold text-white shadow-[0_18px_34px_-20px_rgba(15,23,42,0.85)] ring-4 ring-white/90 transition-all focus:outline-none focus-visible:ring-primary/70",
        active
          ? "h-10 w-10 scale-110 bg-primary"
          : "h-8 w-8 bg-foreground hover:bg-primary",
      )}
    >
      {number}
    </button>
  );
}

export default function MapTab({ lang }: { lang: Lang }) {
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const tourMapStops = React.useMemo<TourMapStop[]>(() => {
    const prefix = dayPrefixes[lang] ?? dayPrefixes.es;

    return tourMapStopsSource.map((stop, index) => ({
      ...stop,
      dayNumber: String(index + 1).padStart(2, "0"),
      day: `${prefix} ${String(index + 1).padStart(2, "0")}`,
    }));
  }, [lang]);
  const routeSegments = React.useMemo<TourRouteSegment[]>(
    () =>
      tourMapStops.slice(1).map((stop, index) => {
        const previousStop = tourMapStops[index];

        return {
          id: `${previousStop.id}-to-${stop.id}`,
          label: `${previousStop.day} -> ${stop.day}`,
          from: [previousStop.longitude, previousStop.latitude],
          to: [stop.longitude, stop.latitude],
          fromStop: previousStop,
          toStop: stop,
          color: routeColors[index % routeColors.length],
        };
      }),
    [tourMapStops],
  );
  const routeColorExpression = React.useMemo(
    () =>
      [
        "match",
        ["get", "id"],
        ...routeSegments.flatMap((segment) => [segment.id, segment.color]),
        "#2563eb",
      ] as unknown as ExpressionSpecification,
    [routeSegments],
  );
  const tourMapBounds = React.useMemo<[[number, number], [number, number]]>(
    () => [
      [
        Math.min(...tourMapStops.map((stop) => stop.longitude)),
        Math.min(...tourMapStops.map((stop) => stop.latitude)),
      ],
      [
        Math.max(...tourMapStops.map((stop) => stop.longitude)),
        Math.max(...tourMapStops.map((stop) => stop.latitude)),
      ],
    ],
    [tourMapStops],
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [activeSegmentId, setActiveSegmentId] = React.useState<string | null>(
    null,
  );
  const selectedStop = tourMapStops.find((stop) => stop.id === selectedId);
  const selectStop = React.useCallback(
    (stop: TourMapStop) => {
      const relatedSegment = routeSegments.find(
        (segment) => segment.toStop.id === stop.id,
      );

      setSelectedId(stop.id);
      setActiveSegmentId(relatedSegment?.id ?? null);

      mapRef.current?.flyTo({
        center: [stop.longitude, stop.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 8),
        duration: 650,
        essential: true,
      });
    },
    [routeSegments],
  );

  return (
    <div className="tour-map-tab grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <style>{`
				.tour-map-tab,
				.tour-map-tab .maplibregl-map,
				.tour-map-tab .maplibregl-popup,
				.tour-map-tab .maplibregl-ctrl {
					font-family: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;
				}
			`}</style>
      <aside className="order-1 min-w-0 rounded-sm bg-background px-1 py-2 shadow-[0_22px_60px_-52px_rgba(15,23,42,0.65)]">
        <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 lg:block lg:max-h-[720px] lg:space-y-1 lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1 lg:pb-0">
          {tourMapStops.map((stop) => {
            const active = stop.id === selectedId;

            return (
              <button
                key={stop.id}
                type="button"
                className={cn(
                  "relative min-w-[16rem] rounded-sm px-4 py-3 text-left transition-all after:absolute after:right-[-0.25rem] after:top-3 after:h-[calc(100%-1.5rem)] after:w-px after:bg-border/80 after:content-[''] last:after:hidden lg:w-full lg:min-w-0 lg:after:bottom-[-0.125rem] lg:after:left-4 lg:after:right-4 lg:after:top-auto lg:after:h-px lg:after:w-auto",
                  active
                    ? "bg-muted/55 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.7)]"
                    : "hover:bg-muted/35",
                )}
                onClick={() => {
                  selectStop(stop);
                }}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm font-extrabold text-foreground">
                    {stop.day}
                  </span>
                </span>

                <span className="mt-2 block text-sm font-semibold leading-snug text-foreground">
                  {stop.title}
                </span>

                <span className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock
                      className="h-3.5 w-3.5 shrink-0 text-secondary"
                      aria-hidden="true"
                    />
                    Tiempo de recorrido: {stop.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Route
                      className="h-3.5 w-3.5 shrink-0 text-secondary"
                      aria-hidden="true"
                    />
                    Tramo: {stop.routeText}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="order-2 min-h-[520px] overflow-hidden rounded-sm bg-muted/30 shadow-[0_30px_80px_-56px_rgba(15,23,42,0.8)] sm:min-h-[620px] lg:min-h-[720px]">
        <TourMap
          ref={mapRef}
          center={TOUR_MAP_CENTER}
          zoom={6.2}
          minZoom={5}
          maxZoom={15}
          theme="light"
        >
          <MapControls showFullscreen showCompass />
          <FitTourBounds bounds={tourMapBounds} />

          <MapArc<TourRouteSegment>
            id="tour-route-arcs"
            data={routeSegments}
            curvature={0.28}
            samples={96}
            paint={{
              "line-color": routeColorExpression,
              "line-width": [
                "case",
                ["==", ["get", "id"], activeSegmentId ?? ""],
                5,
                3,
              ],
              "line-opacity": 0.82,
            }}
            interactive={false}
          />

          {tourMapStops.map((stop) => (
            <MapMarker
              key={stop.id}
              longitude={stop.longitude}
              latitude={stop.latitude}
              onClick={() => {
                selectStop(stop);
              }}
            >
              <MarkerContent>
                <Pin
                  active={stop.id === selectedId}
                  number={stop.dayNumber}
                  label={`Ver detalles de ${stop.day}`}
                />
              </MarkerContent>
              <MarkerTooltip
                offset={24}
                className={cn(
                  "rounded-sm px-3 py-2 text-xs font-semibold text-slate-900",
                  glassPanelClass,
                )}
              >
                {`${stop.day}: ${stop.title}`}
              </MarkerTooltip>
            </MapMarker>
          ))}

          {selectedStop && (
            <MapPopup
              longitude={selectedStop.longitude}
              latitude={selectedStop.latitude}
              offset={30}
              closeButton
              closeOnClick={false}
              onClose={() => setSelectedId(null)}
              className={cn("min-w-64 rounded-sm p-4", glassPanelClass)}
              focusAfterOpen={false}
            >
              <p className="pr-6 text-sm font-extrabold text-slate-950">
                {selectedStop.day}
              </p>
              <p className="mt-1 text-sm leading-snug text-slate-700">
                {selectedStop.title}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                {selectedStop.description}
              </p>
            </MapPopup>
          )}
        </TourMap>
      </div>
    </div>
  );
}
