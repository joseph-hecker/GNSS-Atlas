import LocationFormats from './LocationFormats';
import LocationEntry from './LocationEntry';
import PlaceSearch from './PlaceSearch';

export default function LocationPanel() {
  return (
    <section className="panel space-y-4">
      <header>
        <h2 className="text-sm font-semibold tracking-tight">Your Location</h2>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
          Click anywhere on a map, type coordinates, or search a place.
        </p>
      </header>
      <LocationFormats />
      <div className="border-t border-slate-800 pt-3">
        <LocationEntry />
      </div>
      <div className="border-t border-slate-800 pt-3">
        <PlaceSearch />
      </div>
    </section>
  );
}
