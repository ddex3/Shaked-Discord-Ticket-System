import { Interaction, MessageFlags } from "discord.js";
import { ButtonIds, ModalIds, SelectMenuIds } from "../utils/constants";
import { handleTicketCreate } from "./ticketCreate";
import {
  handleClaim,
  handleClose,
  handleCloseSubmit,
  handleStaffOptions,
} from "./ticketActions";
import { handleSendTranscript } from "./transcripts";
import {
  handleRename,
  handleRenameSubmit,
  handleAddUser,
  handleAddUserSelect,
  handleRemoveUser,
  handleRemoveUserSelect,
  handleChangePriority,
  handlePrioritySelect,
  handleEscalate,
  handleViewNotes,
  handleAddNote,
  handleStaffNoteSubmit,
} from "./staffControls";
import { handleHelpNavigation } from "./helpPagination";
import { HelpButtonIds } from "../services/helpService";
import { getCommandByName } from "../commands/registry";

export async function handleInteraction(
  interaction: Interaction
): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      const command = getCommandByName(interaction.commandName);
      if (command) {
        await command.execute(interaction);
      }
      return;
    }

    if (interaction.isButton()) {
      switch (interaction.customId) {
        case HelpButtonIds.Previous:
        case HelpButtonIds.Home:
        case HelpButtonIds.Next:
          await handleHelpNavigation(interaction);
          return;
        case ButtonIds.OpenTicket:
          await handleTicketCreate(interaction);
          break;
        case ButtonIds.ClaimTicket:
          await handleClaim(interaction);
          break;
        case ButtonIds.CloseTicket:
          await handleClose(interaction);
          break;
        case ButtonIds.StaffOptions:
          await handleStaffOptions(interaction);
          break;
        case ButtonIds.RenameTicket:
          await handleRename(interaction);
          break;
        case ButtonIds.SendTranscript:
          await handleSendTranscript(interaction);
          break;
        case ButtonIds.AddUser:
          await handleAddUser(interaction);
          break;
        case ButtonIds.RemoveUser:
          await handleRemoveUser(interaction);
          break;
        case ButtonIds.ChangePriority:
          await handleChangePriority(interaction);
          break;
        case ButtonIds.EscalateTicket:
          await handleEscalate(interaction);
          break;
        case ButtonIds.ViewNotes:
          await handleViewNotes(interaction);
          break;
        case ButtonIds.AddNote:
          await handleAddNote(interaction);
          break;
      }
      return;
    }

    if (interaction.isStringSelectMenu()) {
      switch (interaction.customId) {
        case SelectMenuIds.Priority:
          await handlePrioritySelect(interaction);
          break;
        case SelectMenuIds.RemoveUser:
          await handleRemoveUserSelect(interaction);
          break;
      }
      return;
    }

    if (interaction.isUserSelectMenu()) {
      switch (interaction.customId) {
        case SelectMenuIds.AddUser:
          await handleAddUserSelect(interaction);
          break;
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      switch (interaction.customId) {
        case ModalIds.RenameTicket:
          await handleRenameSubmit(interaction);
          break;
        case ModalIds.StaffNote:
          await handleStaffNoteSubmit(interaction);
          break;
        case ModalIds.CloseTicket:
          await handleCloseSubmit(interaction);
          break;
      }
      return;
    }
  } catch (error) {
    console.error("Interaction handling error:", error);
    try {
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Something went wrong while processing your request. Please try again.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch {
    }
  }
}
