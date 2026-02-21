import { GuildMember, PermissionFlagsBits } from "discord.js";
import { getGuildConfig } from "../database/queries";

export function isAdmin(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

export function isStaff(member: GuildMember): boolean {
  const config = getGuildConfig(member.guild.id);
  if (!config) return false;
  const roles = member.roles.cache;
  return !!(
    (config.lowStaffRoleId && roles.has(config.lowStaffRoleId)) ||
    (config.highStaffRoleId && roles.has(config.highStaffRoleId)) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

export function isHighStaff(member: GuildMember): boolean {
  const config = getGuildConfig(member.guild.id);
  if (!config) return false;
  return !!(
    (config.highStaffRoleId &&
      member.roles.cache.has(config.highStaffRoleId)) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}
