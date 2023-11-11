import GoogleMapReact from "google-map-react";
import { Pin } from "lucide-react";

// const AnyReactComponent = ({ text }) => <div>{text}</div>;

export default function Map() {
  const defaultProps = {
    center: {
      lat: 10.99835602,
      lng: 77.01502627,
    },
    zoom: 11,
  };

  return (
    // Important! Always set the container height explicitly
    <div className="w-full h-[200px]">
      <GoogleMapReact
        bootstrapURLKeys={{ key: "" }}
        defaultCenter={defaultProps.center}
        defaultZoom={defaultProps.zoom}
      >
        <Pin />
      </GoogleMapReact>
    </div>
  );
}
