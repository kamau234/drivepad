# DrivePad final validation checklist

## Automated repository checks

- [ ] `npm test`
- [ ] `npm run build`
- [ ] `dotnet build bridge/virtual-controller/hidmaestro-helper/HidMaestro.Helper.csproj -c Release -r win-x64 -p:HidMaestroSdkRoot=...`
- [ ] `packaging/windows/publish-helper.ps1` produces `artifacts/windows/hidmaestro-helper`
- [ ] no temporary smoke-test project is present in the package

## Runtime checks on Windows

- [ ] host starts and reports the actual provider state
- [ ] tray lifecycle starts, shows status, and quits idempotently
- [ ] helper starts and returns `ready`
- [ ] provider readiness is distinct from phone authentication
- [ ] authenticated phone state packets are applied
- [ ] watchdog timeout releases all controls
- [ ] disconnect releases all controls
- [ ] manual shutdown releases, disposes, and stops the bridge

## Windows device checks

- [ ] `XBOX 360 For Windows` appears in `joy.cpl`
- [ ] analog axes respond
- [ ] buttons respond and release
- [ ] neutral/release behavior is correct
- [ ] controller disappears or is disposed on shutdown as documented
- [ ] restart recreates the controller correctly

## Game checks

- [ ] Windows controller test harness
- [ ] compatible racing game
- [ ] steering
- [ ] throttle
- [ ] brake
- [ ] mapped buttons
- [ ] disconnect/timeout fails safely

Mark each item as one of: **automated**, **Windows-machine**, **real-device**, or **actual-game**. Do not mark the final system complete until the phone, packaged host, real virtual controller, and actual game path pass together.
