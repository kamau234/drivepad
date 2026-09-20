using System.Text.Json;
using HIDMaestro;

using var context = new HMContext();

HMController? controller = null;

try
{
    string? line;

    while ((line = Console.ReadLine()) is not null)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            continue;
        }

        var requestId = TryReadRequestId(line);

        try
        {
            using var document = JsonDocument.Parse(line);
            var root = document.RootElement;

            var id = root.GetProperty("id").GetInt32();
            var type = root.GetProperty("type").GetString();

            switch (type)
            {
                case "initialize":
                    Initialize(root, id);
                    break;

                case "apply":
                    EnsureController();
                    ApplyState(root.GetProperty("state"), id);
                    break;

                case "releaseAll":
                    EnsureController();
                    controller!.SubmitState(new HMGamepadState());
                    Write(new
                    {
                        id,
                        type = "ok",
                        operation = "releaseAll"
                    });
                    break;

                case "close":
                    ReleaseAndDispose();

                    Write(new
                    {
                        id,
                        type = "ok",
                        operation = "close"
                    });

                    return;

                default:
                    throw new InvalidOperationException(
                        $"Unknown helper request type: {type ?? "<null>"}"
                    );
            }
        }
        catch (Exception error)
        {
            Write(new
            {
                id = requestId,
                type = "error",
                operation = "request",
                message = error.Message
            });
        }
    }
}
finally
{
    ReleaseAndDispose();
}

void Initialize(JsonElement root, int id)
{
    if (controller is not null)
    {
        throw new InvalidOperationException(
            "HIDMaestro controller is already initialized"
        );
    }

    var profileName =
        root.TryGetProperty("profile", out var profileElement)
            ? profileElement.GetString()
            : null;

    if (profileName != "xbox-360-wired")
    {
        throw new InvalidOperationException(
            "Only the xbox-360-wired profile is supported"
        );
    }

    context.LoadDefaultProfiles();

    var profile = context.GetProfile("xbox-360-wired")
        ?? throw new InvalidOperationException(
            "xbox-360-wired profile not found"
        );

    controller = context.CreateController(profile);

    Write(new
    {
        id,
        type = "ready",
        provider = "hidmaestro",
        profile = "xbox-360-wired"
    });
}

void ApplyState(JsonElement state, int id)
{
    var output = new HMGamepadState
    {
        LeftX = ToCenteredAxis(
            state.GetProperty("leftStickX").GetDouble()
        ),
        LeftY = ToCenteredAxis(
            state.GetProperty("leftStickY").GetDouble()
        ),
        RightTrigger = ToTrigger(
            state.GetProperty("rightTrigger").GetDouble()
        ),
        LeftTrigger = ToTrigger(
            state.GetProperty("leftTrigger").GetDouble()
        ),
        Buttons = ParseButtons(
            state.GetProperty("buttons")
        )
    };

    controller!.SubmitState(output);

    Write(new
    {
        id,
        type = "ok",
        operation = "apply"
    });
}

static ushort ToCenteredAxis(double value)
{
    var clamped = Math.Clamp(value, -1.0, 1.0);
    var normalized = (clamped + 1.0) / 2.0;

    return (ushort)Math.Round(
        normalized * ushort.MaxValue,
        MidpointRounding.AwayFromZero
    );
}

static ushort ToTrigger(double value)
{
    var clamped = Math.Clamp(value, 0.0, 1.0);

    return (ushort)Math.Round(
        clamped * ushort.MaxValue,
        MidpointRounding.AwayFromZero
    );
}

static HMButton ParseButtons(JsonElement buttonsElement)
{
    if (buttonsElement.ValueKind != JsonValueKind.Array)
    {
        throw new InvalidOperationException(
            "The buttons field must be an array"
        );
    }

    var buttons = HMButton.None;

    foreach (var buttonElement in buttonsElement.EnumerateArray())
    {
        var buttonName = buttonElement.GetString();

        if (string.IsNullOrWhiteSpace(buttonName))
        {
            throw new InvalidOperationException(
                "Controller button names must be non-empty strings"
            );
        }

        if (!Enum.TryParse<HMButton>(
                buttonName,
                ignoreCase: true,
                out var button))
        {
            throw new InvalidOperationException(
                $"Unsupported HIDMaestro button: {buttonName}"
            );
        }

        buttons |= button;
    }

    return buttons;
}

void EnsureController()
{
    if (controller is null)
    {
        throw new InvalidOperationException(
            "HIDMaestro controller is not initialized"
        );
    }
}

void ReleaseAndDispose()
{
    if (controller is null)
    {
        return;
    }

    try
    {
        controller.SubmitState(new HMGamepadState());
    }
    finally
    {
        controller.Dispose();
        controller = null;
    }
}

static int TryReadRequestId(string line)
{
    try
    {
        using var document = JsonDocument.Parse(line);

        return document.RootElement
            .GetProperty("id")
            .GetInt32();
    }
    catch
    {
        return 0;
    }
}

static void Write(object response)
{
    Console.WriteLine(JsonSerializer.Serialize(response));
    Console.Out.Flush();
}
