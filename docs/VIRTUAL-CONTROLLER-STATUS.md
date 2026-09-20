# Provider implementation status

The repository currently contains the provider interface, normalized mapping, provider factory contract, and verification checklist. It does **not** contain a real Windows driver adapter yet.

A real adapter cannot be responsibly implemented or declared verified from the GitHub environment alone: it requires selecting a currently maintained backend, installing its Windows driver on a test machine, and confirming enumeration and input behavior in `joy.cpl` or the backend's official diagnostic utility.

The next operator step is to choose and install a backend that satisfies the checklist in `bridge/virtual-controller/README.md`. Do not install retired ViGEmBus-based software merely to make the demo appear complete.
