const placeOverlay = new kakao.maps.CustomOverlay({zIndex: 1});
const contentNode = document.createElement("div");
const markerList = [];
let currCategory = "";
let pagination = null;
const categoryCounts = { BK9: 0, MT1: 0, PM9: 0, OL7: 0, CE7: 0, CS2: 0, FD6: 0, HP8: 0, AT4: 0, AD5: 0 };
let totalPlacesCount = 0;
let currentIndex = 0;   // 현재 인덱스

// 상수로 분리한 마커 이미지 설정
const MARKER_IMAGE_SRC = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/places_category.png';
const MARKER_IMAGE_SIZE = new kakao.maps.Size(27, 28);
const SPRITE_SIZE = new kakao.maps.Size(72, 208);
const SPRITE_OFFSET = new kakao.maps.Point(11, 28);

const PLACEHOLDER_IMAGES = {
  FD6: 'https://via.placeholder.com/27x28/ff0000/ffffff?text=R&shape=sign',
  HP8: 'https://via.placeholder.com/27x28/ff0000/ffffff?text=H&shape=sign',
  AT4: 'https://via.placeholder.com/27x28/ff0000/ffffff?text=A&shape=sign',
  AD5: 'https://via.placeholder.com/27x28/ff0000/ffffff?text=HT&shape=sign'
};


// 엘리먼트에 이벤트 핸들러를 등록하는 함수입니다
const addEventHandle = (target, type, callback) => {
  if (target.addEventListener) {
    target.addEventListener(type, callback);
  } else {
    target.attachEvent(`on${type}`, callback);
  }
}

// 커스텀 오버레이의 기본 설정
contentNode.className = "placeinfo_wrap";
addEventHandle(contentNode, "mousedown", kakao.maps.event.preventMap);
addEventHandle(contentNode, "touchstart", kakao.maps.event.preventMap);
placeOverlay.setContent(contentNode);

// 카테고리 검색을 요청하는 함수입니다
const searchPlacesCategory = () => {
  if (!currCategory) return;

  placeOverlay.setMap(null);
  removeMarker();
  
  ps.categorySearch(currCategory, placesSearchCB, { location: map.getCenter(), radius: 1000 });
}

// 장소검색이 완료됐을 때 호출되는 콜백함수입니다
const placesSearchCB = (data, status, _pagination) => {
  if (status === kakao.maps.services.Status.OK) {
    displayPlaces(data);
    updateCategoryCounts(data.length);
    totalPlacesCount += data.length;
    console.log(`현재까지 검색된 총 장소의 수: ${totalPlacesCount}`);

    pagination = _pagination;
    if (pagination.hasNextPage) pagination.nextPage();

  } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
    console.log("검색 결과가 없습니다.");
  } else if (status === kakao.maps.services.Status.ERROR) {
    console.error("검색 중 오류가 발생했습니다.");
  }
}

// 카테고리별 장소 수 업데이트 함수
const updateCategoryCounts = (count) => {
  categoryCounts[currCategory] += count;
  console.log(`현재 카테고리(${currCategory})의 총 장소 수: ${categoryCounts[currCategory]}`);
}

// 지도에 마커를 표출하는 함수입니다
const displayPlaces = (places) => {
  const order = document.getElementById(currCategory).getAttribute('data-order');
  
  places.forEach(place => {
    const marker = addMarker(new kakao.maps.LatLng(place.y, place.x), order, place.category_group_code);
    kakao.maps.event.addListener(marker, "click", () => displayPlaceInfo(place));
  });
}

// 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
const addMarker = (position, order, categoryCode) => {
  let markerImage;
  if (PLACEHOLDER_IMAGES[categoryCode]) {
    const imgSrc = PLACEHOLDER_IMAGES[categoryCode];
    markerImage = new kakao.maps.MarkerImage(imgSrc, MARKER_IMAGE_SIZE);
  } else {
    const imgOptions = {
      spriteSize: SPRITE_SIZE,
      spriteOrigin: new kakao.maps.Point(46, order * 36),
      offset: SPRITE_OFFSET
    };
    markerImage = new kakao.maps.MarkerImage(MARKER_IMAGE_SRC, MARKER_IMAGE_SIZE, imgOptions);
  }

  const marker = new kakao.maps.Marker({ position, image: markerImage });
  marker.setMap(map);
  markerList.push(marker);
  return marker;
}

// 지도 위에 표시되고 있는 마커를 모두 제거합니다
const removeMarker = () => {
  markerList.forEach(marker => marker.setMap(null));
  markerList.length = 0;
}

// 클릭한 마커에 대한 장소 상세정보를 커스텀 오버레이로 표시하는 함수입니다
const displayPlaceInfo = (place) => {
  let content = `<div class="placeinfo">
                  <a class="title" href="${place.place_url}" target="_blank" title="${place.place_name}">${place.place_name}</a>`;
  
  if (place.road_address_name) {
    content += `<span title="${place.road_address_name}">${place.road_address_name}</span>
                <span class="jibun" title="${place.address_name}">(지번 : ${place.address_name})</span>`;
  } else {
    content += `<span title="${place.address_name}">${place.address_name}</span>`;
  }
  
  content += `<span class="tel">${place.phone}</span></div><div class="after"></div>`;
  contentNode.innerHTML = content;
  placeOverlay.setPosition(new kakao.maps.LatLng(place.y, place.x));
  placeOverlay.setMap(map);  
}

const scrollCategories = (direction) => {
  const category = document.getElementById("category");
  const maxIndex = category.children.length - 5; // 5개의 카테고리만 보이도록 설정
  currentIndex = Math.max(0, Math.min(maxIndex, currentIndex + direction));
  const scrollAmount = currentIndex * 50; // 한 카테고리의 폭
  category.style.transform = `translateX(-${scrollAmount}px)`;
}

// 각 카테고리에 클릭 이벤트를 등록하는 함수입니다
const addCategoryClickEvent = () => {
  const category = document.getElementById("category");
  const children = Array.from(category.children);

  children.forEach(child => child.addEventListener("click", onClickCategory));
}

// 카테고리를 클릭했을 때 호출되는 함수입니다
const onClickCategory = function() {
  const { id, className } = this;
  placeOverlay.setMap(null);

  if (className === "on") {
    currCategory = "";
    changeCategoryClass();
    removeMarker();
  } else {
    currCategory = id;
    changeCategoryClass(this);
    searchPlacesCategory();
  }
}

// 클릭된 카테고리에만 클릭된 스타일을 적용하는 함수입니다
const changeCategoryClass = (el) => {
  const category = document.getElementById("category");
  const children = Array.from(category.children);

  children.forEach(child => child.className = '');
  if (el) el.className = "on";
}

// 지도에 idle 이벤트를 등록합니다
kakao.maps.event.addListener(map, "idle", searchPlacesCategory);

// 각 카테고리에 클릭 이벤트를 등록합니다
addCategoryClickEvent();