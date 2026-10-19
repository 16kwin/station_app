// occt-mesh-worker.js — поток чтения STEP/IGES для окна «3D-модель» карточки номенклатуры
// (Model3D/occt.ts запускает его из воркера конвертации). Обёртка над occt-import-js: в отличие от готового
// occt-import-js-worker.js сообщает об ошибке (тот при сбое молчит) и отдаёт сетки типизированными массивами
// с передачей без копирования. Файл .wasm берётся из этой же папки — сеть не нужна.
importScripts('occt-import-js.js');

self.onmessage = async function (event) {
  try {
    var occt = await occtimportjs();
    var result = occt.ReadFile(event.data.format, event.data.buffer, event.data.params);
    if (!result || !result.success) {
      self.postMessage({ ok: false, message: null });
      return;
    }
    var meshes = [];
    var transfer = [];
    for (var i = 0; i < result.meshes.length; i++) {
      var mesh = result.meshes[i];
      var position = new Float32Array(mesh.attributes.position.array);
      var normal = mesh.attributes.normal ? new Float32Array(mesh.attributes.normal.array) : null;
      var index = new Uint32Array(mesh.index.array);
      var faces = (mesh.brep_faces || []).map(function (face) {
        return { first: face.first, last: face.last, color: face.color || null };
      });
      meshes.push({ name: mesh.name || '', position: position, normal: normal, index: index, color: mesh.color || null, faces: faces });
      transfer.push(position.buffer, index.buffer);
      if (normal) transfer.push(normal.buffer);
    }
    self.postMessage({ ok: true, meshes: meshes }, transfer);
  } catch (error) {
    self.postMessage({ ok: false, message: String((error && error.message) || error) });
  }
};
