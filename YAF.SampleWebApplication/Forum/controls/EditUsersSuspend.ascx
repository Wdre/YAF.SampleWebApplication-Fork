<%@ Control Language="C#" AutoEventWireup="true"
	Inherits="YAF.Controls.EditUsersSuspend" Codebehind="EditUsersSuspend.ascx.cs" %>


<h2 runat="server" id="trHeader">
			<YAF:LocalizedLabel ID="LocalizedLabel1" runat="server" LocalizedPage="PROFILE" LocalizedTag="SUSPEND_USER" />
		</h2>
	<hr />
    <asp:PlaceHolder runat="server" ID="SuspendedHolder">

        <h4>
            <YAF:LocalizedLabel ID="LocalizedLabel5" runat="server" LocalizedPage="PROFILE" LocalizedTag="SUSPEND_CURRENT" />
        </h4>
    <hr />

        <h4>
            <YAF:LocalizedLabel ID="LocalizedLabel7" runat="server" LocalizedPage="PROFILE" LocalizedTag="SUSPEND_REASON" />
        </h4>
        <p>
            <asp:Label runat="server" ID="CurrentSuspendedReason"></asp:Label>
        </p>
    <hr />

        <h4>
            <YAF:LocalizedLabel ID="LocalizedLabel8" runat="server" LocalizedPage="PROFILE" LocalizedTag="SUSPEND_BY" />
        </h4>
        <p>
            <YAF:UserLink runat="server" ID="SuspendedBy"></YAF:UserLink>
        </p>
    <hr />

		<h4>
			<YAF:LocalizedLabel ID="LocalizedLabel2" runat="server" LocalizedPage="PROFILE" LocalizedTag="ENDS" />
		</h4>
		<p>
			<%= this.GetSuspendedTo() %>
			&nbsp;<YAF:ThemeButton runat="server" ID="RemoveSuspension" 
                                   Type="Danger" 
                                   Size="Small" 
                                   OnClick="RemoveSuspension_Click"
                                   TextLocalizedTag="REMOVESUSPENSION"
                                   Icon="flag"/>
		</p>
	<hr />
    </asp:PlaceHolder>

        <h2>
            <YAF:LocalizedLabel ID="LocalizedLabel6" runat="server" LocalizedPage="PROFILE" LocalizedTag="SUSPEND_NEW" />
        </h2>
    <hr />

        <h4>
            <YAF:LocalizedLabel ID="LocalizedLabel4" runat="server" LocalizedPage="PROFILE" LocalizedTag="SUSPEND_REASON" />
        </h4>
        <p>
            <asp:TextBox Style="height:80px;" ID="SuspendedReason" runat="server" TextMode="MultiLine" CssClass="form-control"></asp:TextBox>
        </p>
    <hr />

		<h4>
			<YAF:LocalizedLabel ID="LocalizedLabel3" runat="server" LocalizedPage="PROFILE" LocalizedTag="SUSPEND_USER" />
		</h4>
		<p>
			<asp:TextBox runat="server" ID="SuspendCount" CssClass="Numeric form-control" TextMode="Number" />&nbsp;
            <div class="custom-control custom-radio custom-control-inline">
            <asp:RadioButtonList
				runat="server" ID="SuspendUnit" 
                RepeatLayout="UnorderedList"
                CssClass="list-unstyled" />
            </div>
		</p>
	<hr />
<YAF:Alert runat="server" Type="info">
    <asp:Label runat="server" ID="SuspendInfo"></asp:Label>
</YAF:Alert>

                <div class="text-center">
            <YAF:ThemeButton runat="server" ID="Suspend" OnClick="Suspend_Click" 
                             Type="Primary"
                             Icon="flag"
                             TextLocalizedTag="SUSPEND"/>
            </div>
