const func = async () => {
  console.log(window.mars3ds.mars3d);
};

func();

const information = document.getElementById("info");
information.innerText = `本应用正在使用 Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), 和 Electron (v${versions.electron()})`;
