using System.Globalization;
using System.Reflection;
using System.Text.Json;
using HIDMaestro;

using var context = new HMContext();
HMController? controller = null;

try
{
    string? line;
    while ((line = Console.ReadLine()) is not null)
    {
        try
        {
            using var document = JsonDocument.Parse(line);
            var root = document.RootElement;
            var id = root.GetProperty("id").GetInt32();
            var type = root.GetProperty("type").GetString();
            switch (type)
            {
                case "initialize":
                    var profileName = root.GetProperty("profile").GetString() ?? "xbox-360-wired";
                    context.LoadDefaultProfiles();
                    var profile = context.GetProfile(profileName) ?? throw new InvalidOperationException($"HIDMaestro profile not found: {profileName}");
                    controller = context.CreateController(profile);
                    Write(new { id, type = "ready", provider = "hidmaestro", profile = profileName });
                    break;
                case "apply":
                    EnsureController();
                    Apply(root.GetProperty("state"));
                    Write(new { id, type = "ok", operation = "apply" });
                    break;
                case "releaseAll":
                    EnsureController();
                    controller!.SubmitState(new HMGamepadState());
                    Write(new { id, type = "ok", operation = "releaseAll" });
                    break;
                case "close":
                    controller?.Dispose(); controller = null;
                    Write(new { id, type = "ok", operation = "close" });
                    return;
                default: throw new InvalidOperationException($"Unknown helper request: {type}");
            }
        }
        catch (Exception error)
        {
            Write(new { id = TryGetId(line), type = "error", operation = "request", message = error.Message });
        }
    }
}
finally
{
    controller?.SubmitState(new HMGamepadState());
    controller?.Dispose();
}

void Apply(JsonElement state)
{
    var output = new HMGamepadState();
    SetUShort(output, "LeftX", Axis(state, "leftStickX", true));
    SetUShort(output, "LeftY", Axis(state, "leftStickY", true));
    SetUShort(output, "RightTrigger", Axis(state, "rightTrigger", false));
    SetUShort(output, "LeftTrigger", Axis(state, "leftTrigger", false));
    var buttons = typeof(HMButton).GetEnumValues().Cast<HMButton>().Where(button => state.GetProperty("buttons").EnumerateArray().Any(value => value.GetString() == button.ToString())).Aggregate(default(HMButton), (current, button) => current | button);
    output.Buttons = buttons;
    controller!.SubmitState(output);
}

static ushort Axis(JsonElement state, string name, bool centered) {
    var value = state.GetProperty(name).GetDouble();
    value = Math.Clamp(value, centered ? -1 : 0, 1);
    return (ushort)Math.Round(centered ? (value + 1) * 32767.5 : value * ushort.MaxValue, MidpointRounding.AwayFromZero);
}

static void SetUShort(HMGamepadState state, string property, ushort value) => state.GetType().GetProperty(property, BindingFlags.Public | BindingFlags.Instance)?.SetValue(state, value);
static int TryGetId(string line) { try { return JsonDocument.Parse(line).RootElement.GetProperty("id").GetInt32(); } catch { return 0; } }
static void Write(object response) => Console.WriteLine(JsonSerializer.Serialize(response));
void EnsureController() { if (controller is null) throw new InvalidOperationException("HIDMaestro controller is not initialized"); }
