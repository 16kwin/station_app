occt-import-js 0.0.23 — чтение STEP/IGES в браузере (WebAssembly-сборка Open CASCADE Technology 7.6).
Используется окном «3D-модель» карточки номенклатуры: Model3D/occt.ts запускает occt-import-js-worker.js
в отдельном потоке, файл .wasm загружается рядом с ним. Сеть не нужна — всё лежит здесь.

Лицензии: occt-import-js — LGPL-2.1 (license.occt-import-js.txt), Open CASCADE Technology — LGPL-2.1
с исключением Open CASCADE (license.occt.txt). Файлы подключаются как отдельные модули без изменений,
поэтому их можно заменить другой сборкой той же версии API.

Источник: пакет npm occt-import-js@0.0.23 (каталог dist), автор Viktor Kovács.
При обновлении пакета скопируйте сюда заново occt-import-js.js, occt-import-js.wasm,
occt-import-js-worker.js и файлы лицензий из node_modules/occt-import-js/dist/.
