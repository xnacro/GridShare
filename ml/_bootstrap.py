import os
import sys
import importlib.abc
import importlib.util

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SERVER_DIR = os.path.join(ROOT_DIR, "server")
ML_DIR = os.path.abspath(os.path.dirname(__file__))

for p in (ROOT_DIR, SERVER_DIR, ML_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

class _DynamicModuleLoader(importlib.abc.Loader):
    def __init__(self, target_module):
        self.target_module = target_module

    def create_module(self, spec):
        return None

    def exec_module(self, module):
        target = importlib.import_module(self.target_module)
        for k, v in target.__dict__.items():
            if not (k.startswith("__") and k.endswith("__")):
                setattr(module, k, v)

class _GridShareMetaFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname in ("gridshare", "gridshare.backend"):
            return importlib.util.spec_from_loader(fullname, loader=None, is_package=True)

        target_name = None
        if fullname.startswith("gridshare.backend.app"):
            target_name = fullname.replace("gridshare.backend.app", "app")
        elif fullname.startswith("gridshare.backend.tests"):
            target_name = fullname.replace("gridshare.backend.tests", "tests")
        elif fullname.startswith("gridshare.database"):
            target_name = fullname.replace("gridshare.database", "database")
        elif fullname.startswith("gridshare.simulator"):
            target_name = fullname.replace("gridshare.simulator", "simulator")
        elif fullname.startswith("gridshare.ml"):
            target_name = fullname.replace("gridshare.ml", "ml")

        if target_name:
            try:
                target_spec = importlib.util.find_spec(target_name)
                if target_spec:
                    is_pkg = target_spec.submodule_search_locations is not None
                    return importlib.util.spec_from_loader(
                        fullname,
                        loader=_DynamicModuleLoader(target_name),
                        is_package=is_pkg
                    )
            except Exception:
                pass
        return None

if not any(isinstance(f, _GridShareMetaFinder) for f in sys.meta_path):
    sys.meta_path.insert(0, _GridShareMetaFinder())
