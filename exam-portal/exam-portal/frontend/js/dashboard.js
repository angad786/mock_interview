document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("examPortalToken");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const profileBody = document.getElementById("profileBody");
  const btnLogout = document.getElementById("btnLogout");

  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("examPortalToken");
    localStorage.removeItem("examPortalUser");
    window.location.href = "login.html";
  });

  try {
    const { ok, data, status } = await apiGet("/user/me", token);

    if (status === 401 || status === 403) {
      localStorage.removeItem("examPortalToken");
      localStorage.removeItem("examPortalUser");
      window.location.href = "login.html";
      return;
    }

    if (!ok) {
      profileBody.innerHTML = `<p style="color:#B3261E;">Could not load your profile. Please try logging in again.</p>`;
      return;
    }

    const user = data.user;
    const loc = user.location || {};
    const mapsUrl =
      loc.latitude != null && loc.longitude != null
        ? `https://www.openstreetmap.org/?mlat=${loc.latitude}&mlon=${loc.longitude}#map=15/${loc.latitude}/${loc.longitude}`
        : null;

    profileBody.innerHTML = `
      <div class="detail-row">
        <div class="k">Full name</div>
        <div class="v">${escapeHtml(user.fullName)}</div>
      </div>
      <div class="detail-row">
        <div class="k">Email</div>
        <div class="v">${escapeHtml(user.email)}</div>
      </div>
      <div class="detail-row">
        <div class="k">Candidate ID</div>
        <div class="v">EXM-${String(user.id).padStart(6, "0")}</div>
      </div>
      <div class="detail-row">
        <div class="k">Registered area</div>
        <div class="v">${escapeHtml(loc.text || "—")}</div>
      </div>
      <div class="detail-row" style="display:none;">
        <div class="k">Coordinates</div>
        <div class="v">
          ${loc.latitude != null ? loc.latitude.toFixed(6) : "—"}, ${loc.longitude != null ? loc.longitude.toFixed(6) : "—"}
          ${
            mapsUrl
              ? `<br/><a class="map-link" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">View on map ↗</a>`
              : ""
          }
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    profileBody.innerHTML = `<p style="color:#B3261E;">Could not reach the server. Please try again.</p>`;
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
