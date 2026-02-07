{
  #source : https://nixcademy.com/posts/cpp-with-nix-in-2023-part-1-shell/
  description = "Nix flake for socialNetwork";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux" "aarch64-darwin"
      ];
      perSystem = { config, self', inputs', pkgs, system, ... }: {
        devShells.default = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            gcc
            emscripten
            cmake
            mongoc
            ansible
          ];

          buildInputs = with pkgs; [
            nlohmann_json
          ];

          shellHook = ''
              # emscripten utilise du cache
              # comme avec nix on authorise pas d'écrire dans le store
              # On met le cache dans un répertoire temporaire
              export EM_CACHE="$TMPDIR/emscripten_cache"
          '';
        };
      };
    };
}
