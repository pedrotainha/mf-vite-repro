
// Windows temporarily needs this file, https://github.com/module-federation/vite/issues/68

    import {loadShare} from "@module-federation/runtime";
    const importMap = {
      
        "@repro/pkg-a": async () => {
          let pkg = await import("__mf__virtual/remote__prebuild___mf_0_repro_mf_1_pkg_mf_2_a__prebuild__.js");
            return pkg;
        }
      ,
        "@repro/pkg-b": async () => {
          let pkg = await import("/Users/pedrotainha/repos/mf-vite-repro/packages/pkg-b/dist/index.js");
            return pkg;
        }
      ,
        "react": async () => {
          let pkg = await import("__mf__virtual/remote__prebuild__react__prebuild__.js");
            return pkg;
        }
      ,
        "react-dom": async () => {
          let pkg = await import("__mf__virtual/remote__prebuild__react_mf_2_dom__prebuild__.js");
            return pkg;
        }
      
    }
      const usedShared = {
      
          "@repro/pkg-a": {
            name: "@repro/pkg-a",
            version: "1.0.0",
            scope: ["default"],
            loaded: false,
            from: "remote",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@repro/pkg-a"}' must be provided by host`);
              }
              usedShared["@repro/pkg-a"].loaded = true
              const {"@repro/pkg-a": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = false && "@repro/pkg-a" === "react"
                ? (res?.default ?? res)
                : {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: false,
              requiredVersion: "^1.0.0",
              
            }
          }
        ,
          "@repro/pkg-b": {
            name: "@repro/pkg-b",
            version: "1.0.0",
            scope: ["default"],
            loaded: false,
            from: "remote",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@repro/pkg-b"}' must be provided by host`);
              }
              usedShared["@repro/pkg-b"].loaded = true
              const {"@repro/pkg-b": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = false && "@repro/pkg-b" === "react"
                ? (res?.default ?? res)
                : {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: false,
              requiredVersion: "^1.0.0",
              
            }
          }
        ,
          "react": {
            name: "react",
            version: "19.2.4",
            scope: ["default"],
            loaded: false,
            from: "remote",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"react"}' must be provided by host`);
              }
              usedShared["react"].loaded = true
              const {"react": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = false && "react" === "react"
                ? (res?.default ?? res)
                : {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "*",
              
            }
          }
        ,
          "react-dom": {
            name: "react-dom",
            version: "19.2.4",
            scope: ["default"],
            loaded: false,
            from: "remote",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"react-dom"}' must be provided by host`);
              }
              usedShared["react-dom"].loaded = true
              const {"react-dom": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = false && "react-dom" === "react"
                ? (res?.default ?? res)
                : {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "*",
              
            }
          }
        
    }
      const usedRemotes = [
      ]
      export {
        usedShared,
        usedRemotes
      }
      