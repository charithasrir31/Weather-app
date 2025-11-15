// -------------------------------
// CONFIG
// -------------------------------
const BASE_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

// Weather code to icon mapping (simplified)
const weatherIcons = {
  0: "icon-sunny.webp", // Clear sky
  1: "icon-partly-cloudy.webp", // Mainly clear
  2: "icon-partly-cloudy.webp", // Partly cloudy
  3: "icon-overcast.webp", // Overcast
  45: "icon-fog.webp", // Fog
  48: "icon-fog.webp", // Depositing rime fog
  51: "icon-drizzle.webp", // Light drizzle
  53: "icon-drizzle.webp", // Moderate drizzle
  55: "icon-drizzle.webp", // Dense drizzle
  56: "icon-drizzle.webp", // Light freezing drizzle
  57: "icon-drizzle.webp", // Dense freezing drizzle
  61: "icon-rain.webp", // Slight rain
  63: "icon-rain.webp", // Moderate rain
  65: "icon-rain.webp", // Heavy rain
  66: "icon-rain.webp", // Light freezing rain
  67: "icon-rain.webp", // Heavy freezing rain
  71: "icon-snow.webp", // Slight snow fall
  73: "icon-snow.webp", // Moderate snow fall
  75: "icon-snow.webp", // Heavy snow fall
  77: "icon-snow.webp", // Snow grains
  80: "icon-rain.webp", // Slight rain showers
  81: "icon-rain.webp", // Moderate rain showers
  82: "icon-rain.webp", // Violent rain showers
  85: "icon-snow.webp", // Slight snow showers
  86: "icon-snow.webp", // Heavy snow showers
  95: "icon-storm.webp", // Thunderstorm
  96: "icon-storm.webp", // Thunderstorm with slight hail
  99: "icon-storm.webp" // Thunderstorm with heavy hail
};

// HTML ELEMENTS
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const tempEl = document.getElementById("temp");
const conditionEl = document.getElementById("condition");
const locationEl = document.getElementById("location");
const iconEl = document.getElementById("icon");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const precipEl = document.getElementById("precip");
const forecastGrid = document.getElementById("forecast");
const hourlyGrid = document.getElementById("hourly");
const unitsSelect = document.getElementById("unitsSelect");
const geoBtn = document.getElementById("geoBtn");
const prevDayBtn = document.getElementById("prevDay");
const nextDayBtn = document.getElementById("nextDay");
const selectedDayEl = document.getElementById("selectedDay");

let units = "metric"; // metric or imperial
let currentLocation = null;
let forecastData = null;
let currentDayIndex = 0;

// -------------------------------
// GEOCODING
// -------------------------------
async function geocodeCity(city) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error("City not found");
  return data.results[0];
}

// -------------------------------
// FETCH WEATHER
// -------------------------------
async function fetchWeather(lat, lon) {
  const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weathercode,wind_speed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather data fetch failed");
  return await res.json();
}

// -------------------------------
// WEATHER ICON MAPPING
// -------------------------------
function getWeatherIcon(code) {
  return `./assets/images/${weatherIcons[code] || "icon-sunny.webp"}`;
}

function getWeatherDescription(code) {
  const descriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  return descriptions[code] || "Unknown";
}

// -------------------------------
// UNIT CONVERSIONS
// -------------------------------
function convertTemp(temp) {
  return units === "imperial" ? (temp * 9/5) + 32 : temp;
}

function convertWindSpeed(speed) {
  return units === "imperial" ? speed * 0.621371 : speed;
}

function convertPrecipitation(precip) {
  return units === "imperial" ? precip / 25.4 : precip;
}

function getTempUnit() {
  return units === "imperial" ? "°F" : "°C";
}

function getWindUnit() {
  return units === "imperial" ? "mph" : "km/h";
}

function getPrecipUnit() {
  return units === "imperial" ? "in" : "mm";
}

// -------------------------------
// UPDATE CURRENT WEATHER
// -------------------------------
function updateCurrent(data) {
  const current = data.current_weather;
  const hourly = data.hourly;

  // Find current hour index
  const now = new Date();
  const currentHour = now.getHours();
  const currentIndex = hourly.time.findIndex(time => {
    const hour = new Date(time).getHours();
    return hour === currentHour;
  });

  locationEl.textContent = currentLocation ? `${currentLocation.name}, ${currentLocation.country}` : "Unknown Location";
  conditionEl.textContent = getWeatherDescription(current.weathercode);

  iconEl.src = getWeatherIcon(current.weathercode);

  const temp = convertTemp(current.temperature);
  tempEl.textContent = `${temp.toFixed(1)}${getTempUnit()}`;

  if (currentIndex !== -1) {
    const feelsLike = convertTemp(hourly.apparent_temperature[currentIndex]);
    feelsLikeEl.textContent = `${feelsLike.toFixed(1)}${getTempUnit()}`;
    humidityEl.textContent = `${hourly.relative_humidity_2m[currentIndex]}%`;
    const windSpeed = convertWindSpeed(hourly.wind_speed_10m[currentIndex]);
    windEl.textContent = `${windSpeed.toFixed(1)} ${getWindUnit()}`;
    const precip = convertPrecipitation(hourly.precipitation[currentIndex]);
    precipEl.textContent = `${precip.toFixed(2)} ${getPrecipUnit()}`;
  }


}

// -------------------------------
// UPDATE 7-DAY FORECAST
// -------------------------------
function updateForecast(data) {
  const daily = data.daily;
  forecastGrid.innerHTML = "";

  daily.time.forEach((date, index) => {
    const div = document.createElement("div");
    div.className = "forecast-card";

    const weekday = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
    const maxTemp = convertTemp(daily.temperature_2m_max[index]);
    const minTemp = convertTemp(daily.temperature_2m_min[index]);

    div.innerHTML = `
      <div class="card-day">${weekday}</div>
      <img src="${getWeatherIcon(daily.weathercode[index])}" width="48" alt="weather icon" />
      <div class="card-temp">
        ${maxTemp.toFixed(0)}${getTempUnit()} / ${minTemp.toFixed(0)}${getTempUnit()}
      </div>
    `;

    div.addEventListener("click", () => {
      currentDayIndex = index;
      updateSelectedDay();
      updateHourly(data, index);
    });

    forecastGrid.appendChild(div);
  });

  updateHourly(data, 0);
}

// -------------------------------
// UPDATE HOURLY FORECAST
// -------------------------------
function updateHourly(data, dayIndex) {
  const hourly = data.hourly;
  hourlyGrid.innerHTML = "";

  // Get hours for the selected day
  const startIndex = dayIndex * 24;
  const endIndex = startIndex + 24;

  for (let i = startIndex; i < endIndex; i++) {
    if (i >= hourly.time.length) break;

    const time = new Date(hourly.time[i]);
    const hour = time.getHours();
    const displayHour = hour === 0 ? "12AM" : hour < 12 ? `${hour}AM` : hour === 12 ? "12PM" : `${hour - 12}PM`;

    const div = document.createElement("div");
    div.className = "hourly-item";

    const temp = convertTemp(hourly.temperature_2m[i]);

    div.innerHTML = `
      <div>${displayHour}</div>
      <img src="${getWeatherIcon(hourly.weathercode[i])}" width="40" alt="weather icon" />
      <div>${temp.toFixed(0)}${getTempUnit()}</div>
    `;

    hourlyGrid.appendChild(div);
  }
}

// -------------------------------
// UPDATE SELECTED DAY DISPLAY
// -------------------------------
function updateSelectedDay() {
  const days = ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
  selectedDayEl.textContent = days[currentDayIndex] || `Day ${currentDayIndex + 1}`;
}

// -------------------------------
// MAIN LOAD WEATHER FUNCTION
// -------------------------------
async function loadWeather(location) {
  try {
    let lat, lon, name, country;

    if (typeof location === "string") {
      // City name
      const geoData = await geocodeCity(location);
      lat = geoData.latitude;
      lon = geoData.longitude;
      name = geoData.name;
      country = geoData.country;
    } else {
      // Coordinates
      lat = location.lat;
      lon = location.lon;
      name = location.name || "Current Location";
      country = location.country || "";
    }

    currentLocation = { name, country };
    const data = await fetchWeather(lat, lon);
    forecastData = data;

    updateCurrent(data);
    updateForecast(data);
    updateSelectedDay();
  } catch (err) {
    console.error(err);
    alert("Error loading weather data: " + err.message);
  }
}

// -------------------------------
// EVENT LISTENERS
// -------------------------------
searchBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  if (city) loadWeather(city);
});

searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

unitsSelect.addEventListener("change", () => {
  units = unitsSelect.value;
  if (forecastData) {
    updateCurrent(forecastData);
    updateForecast(forecastData);
    updateHourly(forecastData, currentDayIndex);
  }
});

geoBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      loadWeather({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        name: "Current Location"
      });
    }, () => alert("Location access denied"));
  } else {
    alert("Geolocation is not supported by this browser");
  }
});

prevDayBtn.addEventListener("click", () => {
  if (currentDayIndex > 0) {
    currentDayIndex--;
    updateSelectedDay();
    if (forecastData) updateHourly(forecastData, currentDayIndex);
  }
});

nextDayBtn.addEventListener("click", () => {
  if (currentDayIndex < 6) {
    currentDayIndex++;
    updateSelectedDay();
    if (forecastData) updateHourly(forecastData, currentDayIndex);
  }
});

// LOAD DEFAULT (Current Location)
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(pos => {
    loadWeather({
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      name: "Current Location"
    });
  }, () => {
    // Fallback to New York if geolocation fails
    loadWeather("New York");
  });
} else {
  // Fallback to New York if geolocation not supported
  loadWeather("New York");
}
